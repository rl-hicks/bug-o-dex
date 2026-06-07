from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_env: str = "development"

    database_url: str

    cors_origins: str = "http://localhost:5173"

    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    supabase_url: str
    supabase_secret_key: str
    supabase_bucket_name: str = "bug-images"

    openai_api_key: str

    class Config:
        env_file = ".env"


settings = Settings()