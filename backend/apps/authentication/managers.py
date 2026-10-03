"""UserManager - how User rows get created (including NULL-password OAuth users).

Why a custom manager at all?
- We store password = NULL for pure Google OAuth users (spec users table),
  but Django's default manager always writes an (unusable) hashed password.
- We need a create_superuser() that works with email as the login field.
"""
from django.contrib.auth.base_user import BaseUserManager


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, email, password=None, **extra_fields):
        """Low-level create used by both create_user and create_superuser.

        email is normalized to lowercase before saving so that lookups are
        deterministic (two spellings can never become two different rows).
        """
        if not email:
            raise ValueError("Users must have an email address.")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            # Pure Google OAuth user -> DB column stays NULL (per spec).
            # Such users can NEVER log in with a password.
            user.password = None
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        """Admin accounts must always have a password + superuser flags."""
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        # Keep the DB role enum consistent with Django's superuser flag.
        extra_fields.setdefault("role", "SUPER_ADMIN")
        if not extra_fields.get("username"):
            # Superuser is not created via the register API, so generate a
            # simple stable-ish username from the email local-part.
            extra_fields["username"] = (email or "").split("@")[0] or "admin"
        if password is None:
            raise ValueError("Superuser must have a password.")
        return self._create_user(email, password, **extra_fields)
