import { Log } from "../../models/Log";

type LogViewProps = { logs: Log[] };

export default function LogView({ logs }: LogViewProps) {
  return (
    <div>
      <h1 className="text-center text-3xl text-lower">Logs</h1>
      <div className="w-full mt-10">
        {logs.map((log, i) => (
          <div key={i} className="w-full border bg-gray-200 p-2 rounded-lg">
            <div className="text-red-800 font-bold flex flex-row gap-2 items-center">
              <span>{log.message}</span>
              <span>{log.error}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
