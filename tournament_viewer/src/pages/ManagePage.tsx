import { Tab } from "@headlessui/react";
import PlayersList from "../components/manage/players/PlayersList";
import SongsList from "../components/manage/songs/SongsList";
import TournamentSettings from "../components/manage/tournament/TournamentSettings";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  faCheckCircle,
  faTimesCircle,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import SetupsManager from "../components/manage/setups/SetupsManager";
import CabOrganizationView from "../components/manage/development/Development.tsx";

// eslint-disable-next-line react-refresh/only-export-components
export function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function ManagePage() {
  const [apiKey, setApiKey] = useState<string>("");

  useEffect(() => {
    setApiKey(localStorage.getItem("apiKey") || "");
  }, []);

  useEffect(() => {
    axios.defaults.headers.common["Authorization"] = `${apiKey}`;
  }, [apiKey]);

  return (
    <div>
      <h1 className="text-3xl text-center theme-text">
        Tournament settings
      </h1>
      <div className="flex flex-row justify-center items-center gap-3">
        {apiKey.length === 0 ? (
          <div
            className="flex flex-row gap-2 items-center rounded-md border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-200"
            role="alert"
          >
            <FontAwesomeIcon icon={faTimesCircle} />
            <span>
              No API key set. Please add it to allow tournament editing.
            </span>
          </div>
        ) : (
          <div className="text-green-500 flex flex-row gap-3 items-center font-bold">
            <FontAwesomeIcon icon={faCheckCircle} />
            <span>API key set. You are ready to go!</span>
          </div>
        )}
        <button
          onClick={() => {
            const ak = prompt(
              "Enter your API key",
              apiKey,
            )?.toLocaleLowerCase();
            if (ak) {
              setApiKey(ak);
              localStorage.setItem("apiKey", ak);
            }
          }}
          className="bg-lighter text-white p-2 rounded-lg"
        >
          Set API Key
        </button>
      </div>
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
            <SongsList />
          </Tab.Panel>
          <Tab.Panel>
            <PlayersList />
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
