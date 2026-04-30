# PLAN-06 — Django + PostgreSQL Backend

## Goal

Build a minimal Django REST Framework backend that satisfies every API call the React frontend already makes, backed by a Dockerised PostgreSQL database.

---

## API contract (derived from `Frontend/src/api/`)

All endpoints are prefixed `/api/`.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/questionnaires/` | ✓ | List all questionnaires for the authenticated user |
| `POST` | `/questionnaires/` | ✓ | Create a questionnaire |
| `GET` | `/questionnaires/:id/` | ✓ | Retrieve single questionnaire |
| `PATCH` | `/questionnaires/:id/` | ✓ | Partial update (title, description, surveyJson) |
| `DELETE` | `/questionnaires/:id/` | ✓ | Delete |
| `GET` | `/questionnaires/:id/responses/` | ✓ | List responses for a questionnaire |
| `POST` | `/questionnaires/:id/responses/` | ✗ (public) | Submit a response |
| `POST` | `/auth/token/` | — | Obtain JWT access + refresh tokens |
| `POST` | `/auth/token/refresh/` | — | Refresh access token |

> The frontend reads `localStorage.access_token` and sends it as `Authorization: Bearer <token>`.

---

## Django JSON shapes

### `Questionnaire`
```json
{
  "id": "uuid",
  "title": "string",
  "description": "string | null",
  "questions": [],
  "surveyJson": {},
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```
> `questions` is kept for backward compat; `surveyJson` is the primary field once SurveyJS is wired up. Backend stores both as `JSONField`.

### `QuestionnaireResponse`
```json
{
  "id": "uuid",
  "questionnaireId": "uuid",
  "answers": [],
  "submittedAt": "ISO8601"
}
```

---

## Project layout (target)

```
Backend/
  manage.py
  requirements.txt
  .env.example
  docker-compose.yml          # postgres service
  config/
    __init__.py
    settings.py
    urls.py
    wsgi.py
  questionnaires/
    __init__.py
    models.py
    serializers.py
    views.py
    urls.py
  responses/                  # or nested inside questionnaires app
    __init__.py
    models.py
    serializers.py
    views.py
    urls.py
```

---

## Step-by-step build plan

### Step 1 — Docker Compose (PostgreSQL only)

Create `Backend/docker-compose.yml`:

```yaml
services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: questionnaire_db
      POSTGRES_USER: questionnaire_user
      POSTGRES_PASSWORD: questionnaire_pass   # override via .env in production
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Run with: `docker compose up -d db`

---

### Step 2 — Python environment & Django project

```bash
cd Backend/
python -m venv .venv
source .venv/bin/activate

pip install django djangorestframework djangorestframework-simplejwt \
            django-cors-headers psycopg[binary] python-decouple

pip freeze > requirements.txt

django-admin startproject config .
python manage.py startapp questionnaires
python manage.py startapp responses
```

---

### Step 3 — Settings (`config/settings.py`)

Key additions:
```python
import os
from decouple import config

SECRET_KEY = config('SECRET_KEY')
DEBUG = config('DEBUG', default=False, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1').split(',')

INSTALLED_APPS = [
    ...
    'rest_framework',
    'corsheaders',
    'questionnaires',
    'responses',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # must be before CommonMiddleware
    ...
]

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DB_NAME', default='questionnaire_db'),
        'USER': config('DB_USER', default='questionnaire_user'),
        'PASSWORD': config('DB_PASSWORD', default='questionnaire_pass'),
        'HOST': config('DB_HOST', default='localhost'),
        'PORT': config('DB_PORT', default='5432'),
    }
}

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}

from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
}

CORS_ALLOWED_ORIGINS = config(
    'CORS_ALLOWED_ORIGINS',
    default='http://localhost:5173',
).split(',')

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
```

Create `Backend/.env.example`:
```
SECRET_KEY=change-me
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DB_NAME=questionnaire_db
DB_USER=questionnaire_user
DB_PASSWORD=questionnaire_pass
DB_HOST=localhost
DB_PORT=5432
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

---

### Step 4 — Models

**`questionnaires/models.py`**
```python
import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Questionnaire(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='questionnaires')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    questions = models.JSONField(default=list, blank=True)   # legacy
    survey_json = models.JSONField(default=dict, blank=True) # SurveyJS schema
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
```

**`responses/models.py`**
```python
import uuid
from django.db import models
from questionnaires.models import Questionnaire

class QuestionnaireResponse(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    questionnaire = models.ForeignKey(
        Questionnaire, on_delete=models.CASCADE, related_name='responses'
    )
    answers = models.JSONField(default=list)
    submitted_at = models.DateTimeField(auto_now_add=True)
```

---

### Step 5 — Serializers

**`questionnaires/serializers.py`** — map snake_case DB fields to camelCase JSON:
```python
class QuestionnaireSerializer(serializers.ModelSerializer):
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)
    surveyJson = serializers.JSONField(source='survey_json', required=False)

    class Meta:
        model = Questionnaire
        fields = ['id', 'title', 'description', 'questions', 'surveyJson', 'createdAt', 'updatedAt']
        read_only_fields = ['id', 'createdAt', 'updatedAt']
```

**`responses/serializers.py`**:
```python
class QuestionnaireResponseSerializer(serializers.ModelSerializer):
    questionnaireId = serializers.UUIDField(source='questionnaire_id', read_only=True)
    submittedAt = serializers.DateTimeField(source='submitted_at', read_only=True)

    class Meta:
        model = QuestionnaireResponse
        fields = ['id', 'questionnaireId', 'answers', 'submittedAt']
        read_only_fields = ['id', 'questionnaireId', 'submittedAt']
```

---

### Step 6 — Views

**`questionnaires/views.py`** — owner-scoped ModelViewSet:
```python
from rest_framework import viewsets, permissions

class QuestionnaireViewSet(viewsets.ModelViewSet):
    serializer_class = QuestionnaireSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get', 'post', 'patch', 'delete', 'head', 'options']

    def get_queryset(self):
        return Questionnaire.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)
```

**`responses/views.py`** — GET requires auth, POST is public:
```python
from rest_framework import generics, permissions

class ResponseListCreateView(generics.ListCreateAPIView):
    serializer_class = QuestionnaireResponseSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        return QuestionnaireResponse.objects.filter(
            questionnaire_id=self.kwargs['questionnaire_pk']
        )

    def perform_create(self, serializer):
        serializer.save(questionnaire_id=self.kwargs['questionnaire_pk'])
```

---

### Step 7 — URLs (`config/urls.py`)

```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from questionnaires.views import QuestionnaireViewSet
from responses.views import ResponseListCreateView

router = DefaultRouter()
router.register('questionnaires', QuestionnaireViewSet, basename='questionnaire')

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/questionnaires/<uuid:questionnaire_pk>/responses/', ResponseListCreateView.as_view()),
    path('api/auth/token/', TokenObtainPairView.as_view()),
    path('api/auth/token/refresh/', TokenRefreshView.as_view()),
]
```

---

### Step 8 — Migrations & superuser

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
```

---

### Step 9 — Wire frontend

Set `VITE_API_BASE_URL=http://localhost:8000/api` in `Frontend/.env`.

To authenticate from the browser console during development:
```js
const r = await fetch('http://localhost:8000/api/auth/token/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'admin', password: 'yourpassword' })
})
const { access } = await r.json()
localStorage.setItem('access_token', access)
```

---

### Step 10 — Verification checklist

- [ ] `docker compose up -d db` — postgres container healthy
- [ ] `python manage.py migrate` — no errors
- [ ] `python manage.py runserver` — starts on port 8000
- [ ] `GET /api/questionnaires/` with Bearer token → 200 empty list
- [ ] `POST /api/questionnaires/` → 201 with UUID id + camelCase fields
- [ ] `PATCH /api/questionnaires/:id/` → 200 with updated fields
- [ ] `DELETE /api/questionnaires/:id/` → 204
- [ ] `POST /api/questionnaires/:id/responses/` (no auth) → 201
- [ ] `GET /api/questionnaires/:id/responses/` (auth) → 200 list
- [ ] Frontend `pnpm dev` can create/list questionnaires end-to-end

---

## Out of scope for this plan

- User registration endpoint (use `createsuperuser` for now)
- File uploads
- Email verification
- Production deployment / Gunicorn / Nginx
- Backend containerisation (only DB is Dockerised here)
