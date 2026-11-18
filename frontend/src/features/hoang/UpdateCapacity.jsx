
/**
 * UC-1 Update Shelter Capacity
 * FR-1, FR-2, FR-3, FR-7
 * Author: Hoang Pham
 */
import { useEffect, useRef, useState } from 'react';
import {
  Banner, Button, Card, Input, PageShell
} from '../../components/ui';

export default function UpdateCapacity({ app }) {
  const staff = app.auth.currentStaff();
  const shelterId = staff?.shelterID;

  const [shelter, setShelter] = useState(() =>
    shelterId ? app.shelterStore.getShelter(shelterId) : null
  );

  const [value, setValue] = useState(
    String(shelter?.availableKennels ?? '')
  );
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const dialogRef = useRef(null);
  const confirming = preview !== null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (confirming) {
      dialog.showModal();
      return () => dialog.close();
    }
  }, [confirming]);

  if (!staff || !shelter) {
    return <p>Please sign in to view your shelter.</p>;
  }

  function handleSave() {
    setError('');
    setSuccess('');

    try {
      const result = app.shelterStore.previewCapacityChange(
        shelterId,
        value
      );
      setPreview(result);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleConfirm() {
    if (saving || !preview) return;

    setSaving(true);
    try {
      const result = await app.shelterStore.updateCapacity(
        shelterId,
        preview.newAvailable
      );
      setShelter(result.shelter);
      setValue(String(result.shelter.availableKennels));
      setSuccess(result.message);
      setError('');
      setPreview(null);
    } catch (err) {
      setError(err.message);
      setPreview(null);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    if (saving) return;

    setPreview(null);
    setError('');
    setSuccess('');
    setValue(String(shelter.availableKennels));
  }

  return (
    <PageShell
      nav="Home"
      title="Update Shelter Capacity"
      subtitle={shelter.name}
    >
      {error && (
        <Banner tone="alert" title="Unable to save changes">
          {error}
        </Banner>
      )}

      {success && (
        <Banner tone="success" title="Capacity updated">
          {success}
        </Banner>
      )}

      <Card title="Current capacity">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p>Dogs housed</p>
            <strong>{shelter.dogsHoused}</strong>
          </div>
          <div>
            <p>Available kennels</p>
            <strong>{shelter.availableKennels}</strong>
          </div>
          <div>
            <p>Total capacity</p>
            <strong>{shelter.totalCapacity}</strong>
          </div>
        </div>
      </Card>

      <Card title="Edit available kennels">
        <div className="max-w-lg space-y-4">
          <Input
            label="Available kennels"
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            hint={`Enter a whole number from 0 to ${shelter.totalCapacity}.`}
          />

          <div className="flex gap-3">
            <Button onClick={handleSave}>
              Save changes
            </Button>
            <Button variant="secondary" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </div>
      </Card>

      <dialog
        ref={dialogRef}
        aria-label="Confirm capacity update"
        aria-busy={saving}
        onCancel={(event) => {
          event.preventDefault();
          handleCancel();
        }}
        className="m-auto w-full max-w-md rounded-lg bg-surface p-6 text-ink shadow-lg backdrop:bg-ink/40"
      >
        <h2 className="text-xl font-bold">Confirm Capacity Update</h2>
        <p className="my-5">{preview?.prompt}</p>

        <div className="flex gap-3">
          <Button variant="secondary" onClick={handleCancel} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={saving}>
            {saving ? 'Saving?' : 'Confirm'}
          </Button>
        </div>
      </dialog>
    </PageShell>
  );
}
