from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_env: str = "development"

    database_url: str

    cors_origins: str = "http://localhost:5173"

    registration_enabled: bool = False
    public_vault_user_id: str | None = None
    admin_user_id: str | None = None

    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    supabase_url: str
    supabase_secret_key: str
    supabase_bucket_name: str = "bug-images"
    max_upload_bytes: int = 10_485_760

    openai_api_key: str

    @property
    def is_production(self) -> bool:
        return self.app_env.lower() == "production"

    @property
    def allow_registration(self) -> bool:
        return not self.is_production or self.registration_enabled

    class Config:
        env_file = ".env"


settings = Settings()