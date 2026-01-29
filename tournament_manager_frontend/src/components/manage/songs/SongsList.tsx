import {
  faLayerGroup,
  faPlus,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { Song } from "../../../models/Song";
import axios from "axios";
import Select from "react-select";

export default function SongsList() {
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

  return (
    <div>
      <div className="flex flex-col justify-start gap-3">
        <div className="flex flex-row gap-3">
          <h2 className="theme-text">Songs List</h2>
          <button
            title={
              !selectedGroupName
                ? "plz select group"
                : "Add song in selected group"
            }
            disabled={!selectedGroupName}
            onClick={addNewSongInGroup}
            className="disabled:opacity-50 w-4 text-green-700"
          >
            <FontAwesomeIcon icon={faPlus} />
          </button>
          <button
            title={"Add song in new group"}
            onClick={addNewSongInNewGroup}
            className="disabled:opacity-50 w-4 text-green-700"
          >
            <FontAwesomeIcon icon={faLayerGroup} />
          </button>
        </div>
        <Select
          options={groups.map((g) => {
            return { value: g, label: g };
          })}
          placeholder="Select group..."
          className="w-[300px]"
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
        <div className="flex flex-row gap-3">
          <div className="relative bg-gray-100 w-[400px] h-[400px] overflow-auto">
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
                        : "hover:bg-rossoTag hover:text-white"
                    } cursor-pointer py-2 px-3 flex justify-between items-center gap-3 `}
                  >
                    <span>{song.title}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSong(song.id);
                      }}
                      className="text-sm"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
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
          <div>
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
  return (
    <div className="text-red-400">
      <h3 className="text-2xl theme-text">Song Information</h3>
      <div className="mt-2">
        <h3 className=" theme-text">Title: </h3>
        <span>{song.title}</span>
      </div>
      <div className="mt-2">
        <h3 className="theme-text">Difficulty: </h3>
        <div className="flex flex-row items-center ml-1 gap-1">
          {[...Array(13)].map((_, i) => (
            <span
              key={i}
              className={`${
                i + 1 <= song.difficulty ? "bg-lighter" : "bg-gray-300"
              } h-4 rounded-sm w-2 `}
            ></span>
          ))}

          <span className="ml-2 font-bold">{song.difficulty}</span>
        </div>
      </div>
      <h3 className="mt-3 theme-text">Player Scores</h3>
      <p>No scores on record for this song.</p>
    </div>
  );
}
