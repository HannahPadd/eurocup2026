import {
  faPenToSquare,
  faGaugeHigh,
  faLayerGroup,
  faPlus,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { Song } from "../../../models/Song";
import axios from "axios";
import Select from "react-select";

export default function SongsList({ onImport }: { onImport?: () => void }) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [groups, setGroups] = useState<string[]>([]);

  const [search, setSearch] = useState<string>("");
  const [selectedGroupName, setSelectedGroupName] = useState<string>("");

  const [selectedSongId, setSelectedSongId] = useState<number>(-1);

  useEffect(() => {
    axios.get<Song[]>("songs").then((response) => {
      const { data } = response;
      setSongs(data);
      setGroups([...new Set(data.map((s) => s.group))]);
      if (data.length > 0) setSelectedGroupName(data[0].group);
    });
  }, []);

  const addNewSongInGroup = () => {
    const title = prompt("Enter song title");

    if (!title) return;

    const difficulty = prompt("Enter song difficulty");

    if (title && difficulty) {
      axios
        .post<Song>("songs", { title, difficulty, group: selectedGroupName })
        .then((response) => {
          setSongs([...songs, response.data]);
        });
    }
  };

  const addNewSongInNewGroup = () => {
    const title = prompt("Enter song title");

    if (!title) return;

    const difficulty = prompt("Enter song difficulty");

    if (!difficulty) return;

    const group = prompt("Enter group name");

    if (group && groups.includes(group)) return alert("Group already exists");

    if (title && difficulty && group) {
      axios
        .post<Song>("songs", { title, difficulty, group })
        .then((response) => {
          setSongs([...songs, response.data]);
          setGroups([...groups, group]);
          setSelectedGroupName(group);
        });
    }
  };

  const deleteSong = (id: number) => {
    if (window.confirm("Are you sure you want to delete this song?")) {
      axios.delete(`songs/${id}`).then(() => {
        setSongs(songs.filter((p) => p.id !== id));
        setSelectedSongId(-1);
      });
    }
  };

  const editSongName = (song: Song) => {
    const title = prompt("Edit song title", song.title)?.trim();
    if (!title || title === song.title) {
      return;
    }
    axios.patch<Song>(`songs/${song.id}`, { title }).then((response) => {
      setSongs((prev) =>
        prev.map((item) => (item.id === song.id ? response.data : item)),
      );
    });
  };

  const editSongDifficulty = (song: Song) => {
    const raw = prompt("Edit song difficulty", String(song.difficulty))?.trim();
    if (!raw) {
      return;
    }
    const difficulty = Number(raw);
    if (Number.isNaN(difficulty) || difficulty <= 0) {
      alert("Difficulty must be a positive number.");
      return;
    }
    if (difficulty === song.difficulty) {
      return;
    }
    axios.patch<Song>(`songs/${song.id}`, { difficulty }).then((response) => {
      setSongs((prev) =>
        prev.map((item) => (item.id === song.id ? response.data : item)),
      );
    });
  };

  return (
    <div>
      <div className="flex flex-col justify-start gap-3">
        <div className="flex flex-row gap-3 items-center">
          <h2 className="theme-text">Songs List</h2>
          {onImport && (
            <button
              type="button"
              onClick={onImport}
              className="rounded-md border border-slate-500/40 bg-slate-600/20 px-2 py-1 text-xs font-semibold text-slate-100"
            >
              Import songs
            </button>
          )}
          <button
            title={
              !selectedGroupName
                ? "plz select group"
                : "Add song in selected group"
            }
            disabled={!selectedGroupName}
            onClick={addNewSongInGroup}
            className="disabled:opacity-50 inline-flex items-center gap-2 rounded-md border border-emerald-600 px-2 py-1 text-xs font-semibold text-emerald-700"
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>Add song</span>
          </button>
          <button
            title={"Add song in new group"}
            onClick={addNewSongInNewGroup}
            className="disabled:opacity-50 inline-flex items-center gap-2 rounded-md border border-emerald-600 px-2 py-1 text-xs font-semibold text-emerald-700"
          >
            <FontAwesomeIcon icon={faLayerGroup} />
            <span>New group</span>
          </button>
        </div>
        <Select
          options={groups.map((g) => {
            return { value: g, label: g };
          })}
          placeholder="Select group..."
          className="w-full md:w-[300px]"
          value={
            selectedGroupName
              ? { value: selectedGroupName, label: selectedGroupName }
              : null
          }
          onChange={(selected) =>
            selected
              ? setSelectedGroupName(selected.value)
              : setSelectedGroupName("")
          }
        ></Select>
        <div className="flex flex-col gap-3 md:flex-row">
          <div
            className={`relative bg-gray-100 w-full md:w-[400px] h-[400px] overflow-auto ${
              selectedSongId >= 0 ? "hidden md:block" : ""
            }`}
          >
            <input
              className="p-1 w-full sticky inset-0 border-blu border outline-none"
              type="search"
              placeholder="Search song..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {songs
              .filter((s) => {
                const isInGroup = s.group === selectedGroupName;

                const found =
                  search.length < 0
                    ? true
                    : s.title.toLowerCase().includes(search.toLowerCase());

                return isInGroup && found;
              })
              .sort((a, b) => a.title.localeCompare(b.title))
              .map((song) => {
                return (
                  <div
                    key={song.id}
                    role="button"
                    onClick={() => setSelectedSongId(song.id)}
                    className={`${
                      selectedSongId === song.id
                        ? "bg-rossoTag text-white"
                        : "text-gray-900 hover:bg-rossoTag hover:text-white"
                    } cursor-pointer py-2 px-3 flex justify-between items-center gap-3 `}
                  >
                    <span>{song.title}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          editSongName(song);
                        }}
                        className="text-sm"
                        title="Edit song name"
                      >
                        <FontAwesomeIcon icon={faPenToSquare} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          editSongDifficulty(song);
                        }}
                        className="text-sm"
                        title="Edit difficulty"
                      >
                        <FontAwesomeIcon icon={faGaugeHigh} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSong(song.id);
                        }}
                        className="text-sm"
                        title="Delete song"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>
                );
              })}
            {search.length > 0 &&
              songs.filter((s) =>
                s.title.toLowerCase().includes(search.toLowerCase()),
              ).length === 0 && (
                <div className="text-center py-2 theme-text">
                  No song found
                </div>
              )}
          </div>
          <div className="flex-1 min-w-0">
            {selectedSongId >= 0 && (
              <button
                className="mb-2 inline-flex items-center rounded-md border border-blue-200/60 bg-blue-50 px-3 py-1 text-sm text-blue-700 md:hidden"
                onClick={() => setSelectedSongId(-1)}
              >
                Select other song
              </button>
            )}
            {selectedSongId < 0 && (
              <div>Select a song from the list to view informations.</div>
            )}
            {selectedSongId >= 0 && (
              <SongItem
                song={songs.find((s) => s.id === selectedSongId) as Song}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SongItem({ song }: { song: Song }) {
  const levelCount = 15;
  const colorClass = (index: number) => {
    const ratio = (index + 1) / levelCount;
    if (ratio <= 0.4) return "bg-green-500";
    if (ratio <= 0.75) return "bg-orange-400";
    return "bg-red-500";
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-white">
      <h3 className="text-2xl theme-text">Song Information</h3>
      <div className="mt-3">
        <h3 className="theme-text text-sm uppercase tracking-wide">Title</h3>
        <span className="text-lg font-semibold">{song.title}</span>
      </div>
      <div className="mt-4">
        <h3 className="theme-text text-sm uppercase tracking-wide">Difficulty</h3>
        <div className="flex flex-row items-center ml-1 gap-1">
          {[...Array(levelCount)].map((_, i) => (
            <span
              key={i}
              className={`${
                i + 1 <= song.difficulty ? colorClass(i) : "bg-gray-300"
              } h-4 rounded-sm w-2 `}
            ></span>
          ))}

          <span className="ml-2 font-bold">{song.difficulty}</span>
        </div>
      </div>
      <div className="mt-4">
        <h3 className="theme-text">Player Scores</h3>
        <p className="text-sm text-gray-300">No scores on record for this song.</p>
      </div>
    </div>
  );
}
