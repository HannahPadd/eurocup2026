import { KeyboardEvent, useEffect, useRef, useState } from "react";
import OkModal from "../../../layout/OkModal";

type AddStandingToMatchModalProps = {
  playerId: number;
  songId: number;
  playerName: string;
  songTitle: string;
  open: boolean;
  isManualMatch: boolean;
  onClose: () => void;
  onAddStandingToMatch: (
    playerId: number,
    songId: number,
    percentage: number,
    score: number,
    isFailed: boolean,
  ) => void;
};

export default function AddStandingToMatchModal({
  playerId,
  songId,
  playerName,
  songTitle,
  open,
  isManualMatch,
  onClose,
  onAddStandingToMatch,
}: AddStandingToMatchModalProps) {
  const [percentage, setPercentage] = useState<string>("");
  const [score, setScore] = useState<string>("");
  const [isFailed, setIsFailed] = useState<boolean>(false);
  const percentageInputRef = useRef<HTMLInputElement | null>(null);
  const scoreInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    setPercentage("");
    setScore("");
    setIsFailed(false);
    window.setTimeout(() => {
      percentageInputRef.current?.focus();
    }, 0);
  }, [open, playerId, songId]);

  const onSubmit = () => {
    onAddStandingToMatch(
      playerId,
      songId,
      Number.parseFloat((percentage || "0").replace(",", ".")),
      Number.parseInt(score || "0"),
      isFailed,
    );
    onClose();
  };

  const submitOnEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") {
      return;
    }
    event.preventDefault();
    onSubmit();
  };

  return (
    <OkModal
      title="Add new standing"
      open={open}
      onClose={onClose}
      onOk={onSubmit}
    >
      <h2>
        {playerName} for {songTitle}
      </h2>
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-900">
            Percentage
          </label>
          <input
            ref={percentageInputRef}
            type="text"
            value={percentage}
            onChange={(e) => setPercentage(e.target.value)}
            onKeyDown={submitOnEnter}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        {isManualMatch && (
          <div>
            <label className="block text-sm font-medium text-gray-900">
              Score
            </label>
            <input
              ref={scoreInputRef}
              type="text"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              onKeyDown={submitOnEnter}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-900">
            Failed
          </label>
          <input
            type="checkbox"
            checked={isFailed}
            onChange={(e) => setIsFailed(e.target.checked)}
            className="mt-1 h-4 w-4 border border-gray-300 rounded-sm text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
      </div>
    </OkModal>
  );
}
