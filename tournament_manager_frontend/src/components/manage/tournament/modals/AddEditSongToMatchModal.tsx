import { useEffect, useState } from "react";
import OkModal from "../../../layout/OkModal";
import { Song } from "../../../../models/Song";
import axios from "axios";
import Select from "react-select";

type AddSongToMatchModalProps = {
  divisionId: number;
  matchId: number;
  phaseId: number;
  songId?: number | null;
  open: boolean;
  onClose: () => void;
  onAddSongToMatchByRoll: (
    divisionId: number,
    phaseId: number,
    matchId: number,
    group: string,
    level: string,
  ) => void;
  onAddSongToMatchBySongId: (
    divisionId: number,
    phaseId: number,
    matchId: number,
    songId: number,
  ) => void;
  onEditSongToMatchByRoll: (
    divisionId: number,
    phaseId: number,
    matchId: number,
    group: string,
    level: string,
    editSongId: number,
  ) => void;
  onEditSongToMatchBySongId: (
    divisionId: number,
    phaseId: number,
    matchId: number,
    songId: number,
    editSongId: number,
  ) => void;
};

export default function AddEditSongToMatchModal({
  divisionId,
  phaseId,
  matchId,
  songId,
  open,
  onClose,
  onAddSongToMatchByRoll,
  onAddSongToMatchBySongId,
  onEditSongToMatchByRoll,
  onEditSongToMatchBySongId,
}: AddSongToMatchModalProps) {
  const [songAddType, setSongAddType] = useState<"title" | "roll">("roll");

  // if by roll
  const [difficultyInput, setDifficultyInput] = useState<string>("");
  const [songs, setSongs] = useState<Song[]>([]);
  const [songGroups, setSongGroups] = useState<string[]>([]);
  const [selectedGroupName, setSelectedGroupName] = useState<string>("");

  // if by title
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);

  useEffect(() => {
    open &&
      axios.get<Song[]>(`songs`).then((response) => {
        setSongs(response.data);
        setSongGroups([...new Set(response.data.map((s) => s.group))]);
        if (response.data.length > 0)
          setSelectedGroupName(response.data[0].group);
      });
  }, [open]);

  const onSubmit = () => {
    switch (songAddType) {
      case "roll":
        createRoundByRoll();
        break;
      case "title":
        createRoundBySongId();
        break;
    }
  };

  const createRoundByRoll = () => {
    if (selectedGroupName && difficultyInput) {
      songId
        ? onEditSongToMatchByRoll(
            divisionId,
            phaseId,
            matchId,
            selectedGroupName,
            difficultyInput,
            songId,
          )
        : onAddSongToMatchByRoll(
            divisionId,
            phaseId,
            matchId,
            selectedGroupName,
            difficultyInput,
          );

      onClose();
    }
  };

  const createRoundBySongId = () => {
    if (selectedSong) {
      songId
        ? onEditSongToMatchBySongId(
            divisionId,
            phaseId,
            matchId,
            selectedSong.id,
            songId,
          )
        : onAddSongToMatchBySongId(
            divisionId,
            phaseId,
            matchId,
            selectedSong.id,
          );

      onClose();
    }
  };

  return (
    <OkModal
      open={open}
      onClose={onClose}
      title={songId ? "Edit song" : "Add song"}
      onOk={onSubmit}
    >
      <div className="w-full">
        <h3>Songs</h3>
        <div className="flex flex-row gap-3 mb-2">
          <div className="flex flex-row gap-1">
            <input
              type="radio"
              id="title"
              name="songAddType"
              value="title"
              checked={songAddType === "title"}
              onChange={() => setSongAddType("title")}
            />
            <label htmlFor="title">By title</label>
          </div>
          <div className="flex flex-row gap-1">
            <input
              type="radio"
              id="roll"
              name="songAddType"
              value="roll"
              checked={songAddType === "roll"}
              onChange={() => setSongAddType("roll")}
            />
            <label htmlFor="roll">By roll</label>
          </div>
        </div>
        {songAddType === "roll" && (
          <div>
            <div className="w-full py-2">
              <h3>Select song pack to roll</h3>
              <Select
                options={songGroups.map((g) => ({ value: g, label: g }))}
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
                menuPortalTarget={document.body}
                styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
              ></Select>
            </div>

            <h3 className="mt-2">Type song difficulty to roll</h3>

            <div>
              <input
                value={difficultyInput}
                onChange={(e) => setDifficultyInput(e.target.value)}
                className="border border-gray-300 px-2 py-2 mr-2 rounded-lg"
                type="number"
                placeholder="Type difficulty"
              />
            </div>
          </div>
        )}
        {songAddType === "title" && (
          <div>
            <Select
              options={songs.map((s) => ({ value: s.id, label: s.title }))}
              onChange={(e) => {
                setSelectedSong(songs.find((song) => song.id === e?.value)!);
              }}
              value={{ value: selectedSong?.id, label: selectedSong?.title }}
              menuPortalTarget={document.body}
              styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
            />
          </div>
        )}
      </div>
    </OkModal>
  );
}
