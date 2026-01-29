import { Log } from "../../models/Log";

type LogViewerProps = {
  logs: Log[];
};

export default function LogViewer({ logs }: LogViewerProps) {
  return (
    <div>
      {logs.length === 0 && <p>No logs to display</p>}
      <ul className="ml-5 list-disc flex flex-col gap-1">
        {logs.map((log, index) => (
          <li
            key={index}
            className={`${log.error ? "text-red-600" : "text-black"}`}
          >
            <p>
              <strong>{log.timestamp}</strong> &mdash; {log.message} &mdash;{" "}
              {log.error}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
