import { Tab } from "@headlessui/react";
import PlayersList from "../components/manage/players/PlayersList";
import SongsList from "../components/manage/songs/SongsList";
import TournamentSettings from "../components/manage/tournament/TournamentSettings";
import { useEffect, useState } from "react";
import axios from "axios";
import SetupsManager from "../components/manage/setups/SetupsManager";
import ImportModal from "../components/manage/import/ImportModal";
import QualifiersAdmin from "../components/manage/qualifiers/QualifiersAdmin";
import CabOrganizationView from "../components/manage/development/Development.tsx";
import RulesetsManager from "../components/manage/rulesets/RulesetsManager";
import useAuth from "../hooks/useAuth";

// eslint-disable-next-line react-refresh/only-export-components
export function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function ManagePage() {
  const [apiKey, setApiKey] = useState<string>("");
  const [importMode, setImportMode] = useState<"songs" | "players" | null>(
    null,
  );
  const { auth } = useAuth();

  useEffect(() => {
    setApiKey(localStorage.getItem("apiKey") || "");
  }, []);

  useEffect(() => {
    axios.defaults.headers.common["Authorization"] = `${apiKey}`;
  }, [apiKey]);

  const handleGenerateAPI = async () => {
    try {
      const response = await axios.post(
        "auth/genapi",
        {
          username: auth?.username,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${auth?.accessToken}`,
          },
          withCredentials: true,
        },
      );
      console.log("Your new API Key:", response.data.rawKey);
      alert(
        `Save this key, it won't be shown again: \n${response.data.rawKey}`,
      );
    } catch (error) {
      console.error("Failed to generate API key", error);
    }
  };
  return (
    <div>
      <h1 className="text-3xl text-center theme-text">Tournament settings</h1>
      <div className="flex flex-row flex-wrap justify-center items-center p-5 gap-3">
        <section>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-500 transition disabled:cursor-not-allowed disabled:opacity-70"
              onClick={handleGenerateAPI}
            >
              Generate API Token
            </button>
        </section>
      </div>
      <ImportModal
        mode={importMode}
        open={importMode !== null}
        onClose={() => setImportMode(null)}
      />
      <Tab.Group>
        <Tab.List className="flex flex-row gap-10 border-b mt-5">
          <Tab
            className={({ selected }) =>
              classNames(
                "py-2 px-4 text-lg",
                selected
                  ? "border-b-2 border-rossoTesto font-bold theme-text"
                  : "text-gray-500",
              )
            }
          >
            General
          </Tab>
          <Tab
            className={({ selected }) =>
              classNames(
                "py-2 px-4 text-lg",
                selected
                  ? "border-b-2 border-rossoTesto font-bold theme-text"
                  : "text-gray-500",
              )
            }
          >
            Songs
          </Tab>
          <Tab
            className={({ selected }) =>
              classNames(
                "py-2 px-4 text-lg",
                selected
                  ? "border-b-2 border-rossoTesto font-bold theme-text"
                  : "text-gray-500",
              )
            }
          >
            Players
          </Tab>
          <Tab
            className={({ selected }) =>
              classNames(
                "py-2 px-4 text-lg",
                selected
                  ? "border-b-2 border-rossoTesto font-bold theme-text"
                  : "text-gray-500",
              )
            }
          >
            Qualifiers
          </Tab>
          <Tab
            className={({ selected }) =>
              classNames(
                "py-2 px-4 text-lg",
                selected
                  ? "border-b-2 border-rossoTesto font-bold theme-text"
                  : "text-gray-500",
              )
            }
          >
            Rulesets
          </Tab>
          <Tab
            className={({ selected }) =>
              classNames(
                "py-2 px-4 text-lg",
                selected
                  ? "border-b-2 border-rossoTesto font-bold theme-text"
                  : "text-gray-500",
              )
            }
          >
            Setups
          </Tab>
          <Tab
            className={({ selected }) =>
              classNames(
                "py-2 px-4 text-lg",
                selected
                  ? "border-b-2 border-rossoTesto font-bold theme-text"
                  : "text-gray-500",
              )
            }
          >
            Organization
          </Tab>
        </Tab.List>
        <Tab.Panels className="mt-3">
          <Tab.Panel>
            <TournamentSettings controls />
          </Tab.Panel>
          <Tab.Panel>
            <SongsList onImport={() => setImportMode("songs")} />
          </Tab.Panel>
          <Tab.Panel>
            <PlayersList onImport={() => setImportMode("players")} />
          </Tab.Panel>
          <Tab.Panel>
            <QualifiersAdmin />
          </Tab.Panel>
          <Tab.Panel>
            <RulesetsManager />
          </Tab.Panel>
          <Tab.Panel>
            <SetupsManager />
          </Tab.Panel>
          <Tab.Panel>
            <CabOrganizationView />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
}
