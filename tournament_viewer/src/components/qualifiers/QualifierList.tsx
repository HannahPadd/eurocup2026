const qualifierBarCount = 15;
const qualifierBarColor = (index: number) => {
  const ratio = (index + 1) / qualifierBarCount;
  if (ratio <= 0.4) return "bg-green-500";
  if (ratio <= 0.75) return "bg-orange-400";
  return "bg-red-500";
};

export type QualifierListItem = {
  key: string;
  divisionName: string;
  songId: number;
  songTitle: string;
  difficulty: number;
};

type QualifierInput = {
  percentage: string;
  screenshotUrl: string;
};

type Props = {
  items: QualifierListItem[];
  inputs: Record<number, QualifierInput>;
  onChange: (songId: number, field: "percentage" | "screenshotUrl", value: string) => void;
  onBlurPercentage: (songId: number, value: string) => void;
  flash: boolean;
  flashKey: number;
};

export default function QualifierList({
  items,
  inputs,
  onChange,
  onBlurPercentage,
  flash,
  flashKey,
}: Props) {
  return (
    <>
      {items.map((item) => {
        const input = inputs[item.songId] || {
          percentage: "",
          screenshotUrl: "",
        };
        return (
          <div
            key={`${item.key}-${flashKey}`}
            className={`grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,0.9fr)_minmax(0,1.4fr)] lg:grid-cols-[minmax(0,2.4fr)_minmax(0,1fr)_minmax(0,1.6fr)] gap-3 items-center bg-white/5 border border-white/10 rounded-lg p-4 ${
              flash ? "qualifier-flash" : ""
            }`}
          >
            <div>
              <div className="font-semibold">{item.songTitle}</div>
              <div className="mt-1 flex items-center gap-2 text-xs text-gray-300">
                <span>{item.divisionName}</span>
                <span className="text-gray-400">{item.difficulty}</span>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: qualifierBarCount }).map((_, i) => (
                    <span
                      key={i}
                      className={`${
                        i + 1 <= item.difficulty
                          ? qualifierBarColor(i)
                          : "bg-gray-600"
                      } h-[0.6rem] w-1.5 mt-[0.1rem] rounded-sm`}
                    ></span>
                  ))}
                </div>
              </div>
            </div>
            <input
              type="text"
              placeholder="Score (77.77)"
              className="w-full rounded-md bg-white text-black px-3 py-1.5"
              value={input.percentage}
              onChange={(event) =>
                onChange(item.songId, "percentage", event.target.value)
              }
              onBlur={(event) => onBlurPercentage(item.songId, event.target.value)}
            />
            <input
              type="url"
              placeholder="Screenshot URL"
              className="w-full rounded-md bg-white text-black px-3 py-1.5 text-[0.95rem]"
              value={input.screenshotUrl}
              onChange={(event) =>
                onChange(item.songId, "screenshotUrl", event.target.value)
              }
            />
          </div>
        );
      })}
    </>
  );
}
