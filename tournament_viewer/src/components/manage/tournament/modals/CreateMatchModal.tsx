import {useEffect, useState} from "react";
import OkModal from "../../../layout/OkModal";
import {Player} from "../../../../models/Player";
import axios from "axios";
import Select from "react-select";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faMinusCircle, faPlusCircle} from "@fortawesome/free-solid-svg-icons";
import {Song} from "../../../../models/Song";
import {Division} from "../../../../models/Division";
import {Phase} from "../../../../models/Phase";
import {CreateMatchRequest} from "../../../../models/requests/match-requests";

type CreateMatchModal = {
    open: boolean;
    onClose: () => void;
    onCreate: (request: CreateMatchRequest) => void;
    phase: Phase;
    division: Division;
};

export default function CreateMatchModal({
                                             open,
                                             onClose,
                                             onCreate,
                                             phase,
                                             division,
                                         }: CreateMatchModal) {
    const [players, setPlayers] = useState<Player[]>([]);
    const [scoringSystems, setScoringSystems] = useState<string[]>([])
    const [scoringSystem, setScoringSystem] = useState("");

    const [matchName, setMatchName] = useState<string>("");
    const [subtitle, setSubtitle] = useState<string>("");
    const [multiplier, setMultiplier] = useState<number>(1);
    const [isManualMatch, setIsManualMatch] = useState<boolean>(false);

    const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);

    const [songAddType, setSongAddType] = useState<"title" | "roll">("roll");
    // if by roll
    const [selectedSongDifficulties, setSelectedSongDifficulties] = useState<
        string[]
    >([]);
    const [difficultyInput, setDifficultyInput] = useState<string>("");
    const [songs, setSongs] = useState<Song[]>([]);
    const [songGroups, setSongGroups] = useState<string[]>([]);
    const [selectedGroupName, setSelectedGroupName] = useState<string>("");

    // if by title
    const [selectedSongs, setSelectedSongs] = useState<Song[]>([]);

    useEffect(() => {
        open &&
        axios.get<Player[]>(`players`).then((response) => {
            setPlayers(response.data);
        });

        open &&
        axios.get<Song[]>(`songs`).then((response) => {
            setSongs(response.data);
            setSongGroups([...new Set(response.data.map((s) => s.group))]);
            if (response.data.length > 0)
                setSelectedGroupName(response.data[0].group);
        });

        open &&
        axios.get("tournament/possibleScoringSystem").then((response) => {
            setScoringSystems(response.data);
            setScoringSystem(response.data[0]);
        });
    }, [open]);

    const onSubmit = () => {
        switch (songAddType) {
            case "roll":
                createMatchByRoll();
                break;
            case "title":
                createMatchByTitle();
                break;
        }
    };

    const createMatchByTitle = () => {
        const request = {
            divisionId: division.id,
            phaseId: phase.id,
            matchName: matchName,
            subtitle: subtitle,
            multiplier: multiplier,
            group: selectedGroupName,
            scoringSystem: scoringSystem,
            isManualMatch: isManualMatch,
            songIds: selectedSongs.map((s) => s.id),
            playerIds: selectedPlayers.map((p) => p.id),
        } as CreateMatchRequest;

        onCreate(request);
        onClose();
    };

    const createMatchByRoll = () => {
        const request = {
            divisionId: division.id,
            phaseId: phase.id,
            matchName: matchName,
            subtitle: subtitle,
            multiplier: multiplier,
            group: selectedGroupName,
            scoringSystem: scoringSystem,
            isManualMatch: isManualMatch,
            levels: selectedSongDifficulties.join(","),
            playerIds: selectedPlayers.map((p) => p.id),
        } as CreateMatchRequest;

        onCreate(request);
        onClose();
    };

    return (
        <OkModal
            okText="Create match"
            title="Create Match"
            open={open}
            onClose={onClose}
            onOk={onSubmit}
        >
            <div className="flex flex-col w-full gap-3">
                <div className="w-full">
                    <h3>Name</h3>
                    <input
                        className="w-full border border-gray-300 px-2 py-2 rounded-lg"
                        type="text"
                        value={matchName}
                        onChange={(e) => setMatchName(e.target.value)}
                        placeholder="Type match name"
                    />
                </div>
                <div className="w-full">
                    <h3>Subtitle</h3>
                    <input
                        className="w-full border border-gray-300 px-2 py-2 rounded-lg"
                        type="text"
                        value={subtitle}
                        onChange={(e) => setSubtitle(e.target.value)}
                        placeholder="Type subtitle"
                    />
                </div>
                <div className="w-full">
                    <h3>Multiplier</h3>
                    <input
                        className="w-full border border-gray-300 px-2 py-2 rounded-lg"
                        type="number"
                        value={multiplier}
                        onChange={(e) => setMultiplier(+e.target.value)}
                        placeholder="Type multiplier (number)"
                    />
                </div>
                <div>
                    <h3>Scoring system</h3>
                    <Select
                        options={scoringSystems.map((s) => ({value: s, label: s}))}
                        placeholder="Select scoring system..."
                        value={{value: scoringSystem, label: scoringSystem}}
                        onChange={(selected) => setScoringSystem(selected!.value)}
                        menuPortalTarget={document.body}
                        styles={{menuPortal: (base) => ({...base, zIndex: 9999})}}
                    ></Select>
                </div>
                <div>
                    <h3>Manual match</h3>
                    <input
                        type="checkbox"
                        checked={isManualMatch}
                        onChange={(e) => setIsManualMatch(e.target.checked)}
                    />
                </div>
                <div className="w-full">
                    <h3>Players</h3>
                    <Select
                        isMulti
                        options={players.map((p) => ({value: p.id, label: p.name}))}
                        onChange={(e) => {
                            setSelectedPlayers(
                                e.map((p) => players.find((pl) => pl.id === p.value)!),
                            );
                        }}
                        value={selectedPlayers.map((p) => ({value: p.id, label: p.name}))}
                        menuPortalTarget={document.body}
                        styles={{menuPortal: (base) => ({...base, zIndex: 9999})}}
                    />
                </div>
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
                            <label htmlFor="title">By titles</label>
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
                                    options={songGroups.map((g) => ({value: g, label: g}))}
                                    placeholder="Select group..."
                                    className="w-[300px]"
                                    value={
                                        selectedGroupName
                                            ? {value: selectedGroupName, label: selectedGroupName}
                                            : null
                                    }
                                    onChange={(selected) =>
                                        selected
                                            ? setSelectedGroupName(selected.value)
                                            : setSelectedGroupName("")
                                    }
                                    menuPortalTarget={document.body}
                                    styles={{menuPortal: (base) => ({...base, zIndex: 9999})}}
                                ></Select>
                            </div>

                            <h3 className="mt-2">Type song difficulties to roll</h3>
                            {selectedSongDifficulties.length > 0 && (
                                <div className="flex my-2 flex-col gap-2 w-96">
                                    {selectedSongDifficulties.map((d, i) => (
                                        <div key={i} className="flex flex-row items-center gap-2">
                                            <span className="w-6 font-bold">{d}</span>
                                            <button
                                                onClick={() =>
                                                    setSelectedSongDifficulties(
                                                        selectedSongDifficulties.filter(
                                                            (_, index) => index !== i,
                                                        ),
                                                    )
                                                }
                                                className="text-red-700 text-sm"
                                            >
                                                <FontAwesomeIcon icon={faMinusCircle}/>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div>
                                <input
                                    value={difficultyInput}
                                    onChange={(e) => setDifficultyInput(e.target.value)}
                                    className="border border-gray-300 px-2 py-2 mr-2 rounded-lg"
                                    type="number"
                                    placeholder="Type difficulty"
                                />
                                <button
                                    onClick={() => {
                                        setSelectedSongDifficulties([
                                            ...selectedSongDifficulties,
                                            difficultyInput,
                                        ]);
                                        setDifficultyInput("");
                                    }}
                                    className="text-green-700 text-lg"
                                >
                                    <FontAwesomeIcon icon={faPlusCircle}/>
                                </button>
                            </div>
                        </div>
                    )}
                    {songAddType === "title" && (
                        <div>
                            <Select
                                isMulti
                                options={songs.map((s) => ({value: s.id, label: s.title}))}
                                onChange={(e) => {
                                    setSelectedSongs(
                                        e.map((s) => songs.find((song) => song.id === s.value)!),
                                    );
                                }}
                                value={selectedSongs.map((s) => ({
                                    value: s.id,
                                    label: s.title,
                                }))}
                                menuPortalTarget={document.body}
                                styles={{menuPortal: (base) => ({...base, zIndex: 9999})}}
                            />
                        </div>
                    )}
                </div>
            </div>
        </OkModal>
    );
}
