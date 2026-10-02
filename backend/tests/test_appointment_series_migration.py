from pathlib import Path


def test_migrations_include_appointment_series_support() -> None:
    versions_dir = Path(__file__).resolve().parents[1] / "alembic" / "versions"
    migration_files = sorted(versions_dir.glob("*.py"))
    assert migration_files, "No Alembic migration files found"

    combined_content = "\n".join(path.read_text(encoding="utf-8") for path in migration_files)

    assert "appointment_series" in combined_content
    assert "series_id" in combined_content
    assert "series_occurrence_index" in combined_content
    assert "confirmation_delivery_status" in combined_content
    assert "confirmation_sent_at" in combined_content
