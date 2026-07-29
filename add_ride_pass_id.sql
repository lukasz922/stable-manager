-- StableManager: powiązanie jazdy z konkretnym karnetem
-- Wykonaj tylko raz.

ALTER TABLE rides
ADD COLUMN IF NOT EXISTS pass_id INTEGER NULL;

CREATE INDEX IF NOT EXISTS ix_rides_pass_id
ON rides (pass_id);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_rides_pass_id'
    ) THEN
        ALTER TABLE rides
        ADD CONSTRAINT fk_rides_pass_id
        FOREIGN KEY (pass_id)
        REFERENCES passes(id)
        ON DELETE SET NULL;
    END IF;
END $$;

-- Uzupełnia pass_id dla starszych rozliczonych jazd na podstawie historii.
UPDATE rides AS r
SET pass_id = source.pass_id
FROM (
    SELECT DISTINCT ON (ride_id)
        ride_id,
        pass_id
    FROM pass_history
    WHERE ride_id IS NOT NULL
      AND operation = 'DEDUCT'
    ORDER BY ride_id, created_at DESC, id DESC
) AS source
WHERE r.id = source.ride_id
  AND r.pass_id IS NULL;
