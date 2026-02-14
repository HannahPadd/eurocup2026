import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Setup } from "../../../models/Setup";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTrash, faSave } from "@fortawesome/free-solid-svg-icons";

const emptyForm = {
  name: "",
  cabinetName: "",
  position: 0,
};

export default function SetupsManager() {
  const [setups, setSetups] = useState<Setup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedSetupId, setSelectedSetupId] = useState<number>(-1);
  const [createForm, setCreateForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadSetups = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const response = await axios.get<Setup[]>("setups");
        if (!isMounted) return;
        setSetups(response.data);
        if (response.data.length > 0) {
          setSelectedSetupId(response.data[0].id);
        }
      } catch (error) {
        if (!isMounted) return;
        setLoadError("Unable to load setups. Check your API key and server connection.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadSetups();
    return () => {
      isMounted = false;
    };
  }, []);

  const selectedSetup = useMemo(
    () => setups.find((setup) => setup.id === selectedSetupId) ?? null,
    [setups, selectedSetupId],
  );

  useEffect(() => {
    if (!selectedSetup) {
      setEditForm(emptyForm);
      return;
    }
    setEditForm({
      name: selectedSetup.name ?? "",
      cabinetName: selectedSetup.cabinetName ?? "",
      position: selectedSetup.position ?? 0,
    });
  }, [selectedSetup]);

  const sortedSetups = useMemo(
    () =>
      [...setups].sort((a, b) => {
        if (a.position !== b.position) return a.position - b.position;
        return a.name.localeCompare(b.name);
      }),
    [setups],
  );

  const createSetup = async () => {
    if (!createForm.name.trim() || !createForm.cabinetName.trim()) {
      setLoadError("Name and cabinet name are required.");
      return;
    }
    setSaving(true);
    setLoadError(null);
    try {
      const response = await axios.post<Setup>("setups", {
        name: createForm.name.trim(),
        cabinetName: createForm.cabinetName.trim(),
        position: Number(createForm.position) || 0,
      });
      setSetups((prev) => [...prev, response.data]);
      setSelectedSetupId(response.data.id);
      setCreateForm(emptyForm);
    } catch (error) {
      setLoadError("Unable to create setup.");
    } finally {
      setSaving(false);
    }
  };

  const updateSetup = async () => {
    if (!selectedSetup) return;
    if (!editForm.name.trim() || !editForm.cabinetName.trim()) {
      setLoadError("Name and cabinet name are required.");
      return;
    }
    setSaving(true);
    setLoadError(null);
    try {
      const response = await axios.patch<Setup>(`setups/${selectedSetup.id}`, {
        name: editForm.name.trim(),
        cabinetName: editForm.cabinetName.trim(),
        position: Number(editForm.position) || 0,
      });
      setSetups((prev) =>
        prev.map((setup) =>
          setup.id === response.data.id ? response.data : setup,
        ),
      );
    } catch (error) {
      setLoadError("Unable to update setup.");
    } finally {
      setSaving(false);
    }
  };

  const deleteSetup = async (setupId: number) => {
    if (!window.confirm("Are you sure you want to delete this setup?")) {
      return;
    }
    setSaving(true);
    setLoadError(null);
    try {
      await axios.delete(`setups/${setupId}`);
      setSetups((prev) => prev.filter((setup) => setup.id !== setupId));
      if (selectedSetupId === setupId) {
        setSelectedSetupId(-1);
      }
    } catch (error) {
      setLoadError("Unable to delete setup.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col gap-4">
        <div className="flex flex-row gap-3 items-center">
          <h2 className="theme-text">Setups</h2>
        </div>

        {loadError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {loadError}
          </div>
        )}

        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-200">
          <div className="font-semibold mb-2">Create setup</div>
          <div className="flex flex-col gap-3 md:flex-row">
            <input
              className="w-full rounded-md border border-gray-300 px-2 py-2 text-gray-900"
              type="text"
              placeholder="Name (P1, P2)"
              value={createForm.name}
              onChange={(e) =>
                setCreateForm((prev) => ({ ...prev, name: e.target.value }))
              }
            />
            <input
              className="w-full rounded-md border border-gray-300 px-2 py-2 text-gray-900"
              type="text"
              placeholder="Cabinet name"
              value={createForm.cabinetName}
              onChange={(e) =>
                setCreateForm((prev) => ({
                  ...prev,
                  cabinetName: e.target.value,
                }))
              }
            />
            <input
              className="w-full md:w-32 rounded-md border border-gray-300 px-2 py-2 text-gray-900"
              type="number"
              placeholder="Position"
              value={createForm.position}
              onChange={(e) =>
                setCreateForm((prev) => ({
                  ...prev,
                  position: Number(e.target.value),
                }))
              }
            />
            <button
              type="button"
              onClick={createSetup}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FontAwesomeIcon icon={faPlus} />
              Add
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4 md:flex-row">
          <div
            className={`bg-gray-100 text-gray-900 w-full md:w-[320px] h-[420px] overflow-auto rounded-lg ${
              selectedSetupId >= 0 ? "hidden md:block" : ""
            }`}
          >
            {loading && (
              <div className="text-center py-2 text-gray-500">
                Loading setups...
              </div>
            )}
            {!loading && sortedSetups.length === 0 && (
              <div className="text-center py-2 text-gray-500">
                No setups yet.
              </div>
            )}
            {!loading &&
              sortedSetups.map((setup) => (
                <div
                  key={setup.id}
                  role="button"
                  onClick={() => setSelectedSetupId(setup.id)}
                  className={`${
                    selectedSetupId === setup.id
                      ? "bg-rossoTag text-white"
                      : "hover:bg-red-700 hover:text-white"
                  } cursor-pointer py-2 px-3 flex justify-between items-center gap-3`}
                >
                  <div>
                    <div className="font-semibold">
                      {setup.name} · {setup.cabinetName}
                    </div>
                    <div className="text-xs opacity-75">
                      Position {setup.position}
                      {setup.matchAssignments?.length
                        ? ` · ${setup.matchAssignments.length} assignment(s)`
                        : ""}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSetup(setup.id);
                    }}
                    className="text-sm"
                    title="Delete setup"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              ))}
          </div>

          <div className="flex-1 min-w-0">
            {selectedSetupId >= 0 && (
              <button
                className="mb-2 inline-flex items-center rounded-md border border-blue-200/60 bg-blue-50 px-3 py-1 text-sm text-blue-700 md:hidden"
                onClick={() => setSelectedSetupId(-1)}
              >
                Select other setup
              </button>
            )}

            {!selectedSetup && (
              <div className="theme-text">Select a setup to edit.</div>
            )}

            {selectedSetup && (
              <div className="flex flex-col gap-3 theme-text">
                <h3 className="text-2xl">Setup details</h3>
                <div className="grid gap-3 md:grid-cols-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs uppercase tracking-wide text-gray-400">
                      Name
                    </span>
                    <input
                      className="rounded-md border border-gray-300 px-2 py-2 text-gray-900"
                      type="text"
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs uppercase tracking-wide text-gray-400">
                      Cabinet name
                    </span>
                    <input
                      className="rounded-md border border-gray-300 px-2 py-2 text-gray-900"
                      type="text"
                      value={editForm.cabinetName}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          cabinetName: e.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs uppercase tracking-wide text-gray-400">
                      Position
                    </span>
                    <input
                      className="rounded-md border border-gray-300 px-2 py-2 text-gray-900"
                      type="number"
                      value={editForm.position}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          position: Number(e.target.value),
                        }))
                      }
                    />
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={updateSetup}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <FontAwesomeIcon icon={faSave} />
                    Save changes
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteSetup(selectedSetup.id)}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                    Delete
                  </button>
                </div>
                {selectedSetup.matchAssignments && (
                  <div className="text-sm text-gray-300">
                    {selectedSetup.matchAssignments.length} assignment(s) linked.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
