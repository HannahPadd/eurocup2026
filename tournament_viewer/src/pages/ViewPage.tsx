import { Menu, Tab } from "@headlessui/react";
import { classNames } from "./ManagePage";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle } from "@fortawesome/free-solid-svg-icons";
import LivePhase from "../components/view/LivePhase";
import TournamentSettings from "../components/manage/tournament/TournamentSettings";
import Rankings from "../components/view/Rankings.tsx";
import QualifierRankings from "../components/view/QualifierRankings";
import { useState } from "react";

export default function ViewPage() {
  const [tabIndex, setTabIndex] = useState(0);

  return (
    <div className=" text-white">
      <h1 className="text-3xl text-center theme-text mt-6 mb-6">
        ITG Eurocup 2026
      </h1>
      <Tab.Group selectedIndex={tabIndex} onChange={setTabIndex}>
        <>
          <Tab.List className="flex items-center gap-3 sm:gap-10 border-b mt-5">
            <Tab
              className={({ selected }) =>
                classNames(
                  "py-2 px-3 text-sm sm:px-4 sm:text-lg",
                  selected
                    ? "border-b-2 border-blue-500 font-bold theme-text"
                    : "text-gray-500",
                )
              }
            >
              <div className="flex flex-row gap-3 items-center">
                <FontAwesomeIcon
                  icon={faCircle}
                  className="text-[0.6rem] sm:text-sm animate-pulse text-red-500"
                />
                <span>LIVE</span>
              </div>
            </Tab>
            <Tab
              className={({ selected }) =>
                classNames(
                  "py-2 px-3 text-sm sm:px-4 sm:text-lg",
                  selected
                    ? "border-b-2 border-blue-500 font-bold theme-text"
                    : "text-gray-500",
                )
              }
            >
              <div className="flex flex-row gap-3 items-center">
                <span>Rankings</span>
              </div>
            </Tab>
            <Tab
              className={({ selected }) =>
                classNames(
                  "hidden sm:flex py-2 px-4 text-lg",
                  selected
                    ? "border-b-2 border-blue-500 font-bold theme-text"
                    : "text-gray-500",
                )
              }
            >
              <div className="flex flex-row gap-3 items-center">
                <span>Qualifiers</span>
              </div>
            </Tab>
            <Tab
              className={({ selected }) =>
                classNames(
                  "hidden sm:flex py-2 px-4 text-lg",
                  selected
                    ? "border-b-2 border-blue-500 font-bold theme-text"
                    : "text-gray-500",
                )
              }
            >
              History
            </Tab>
            <Menu as="div" className="relative ml-auto sm:hidden">
              <Menu.Button className="rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm font-semibold text-white">
                Show more
              </Menu.Button>
              <Menu.Items className="absolute right-0 z-10 mt-2 w-44 rounded-md border border-white/10 bg-slate-900/95 p-1 shadow-lg">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      type="button"
                      onClick={() => setTabIndex(2)}
                      className={classNames(
                        "w-full rounded px-3 py-2 text-left text-sm",
                        active ? "bg-white/10 text-white" : "text-gray-200",
                      )}
                    >
                      Qualifiers
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      type="button"
                      onClick={() => setTabIndex(3)}
                      className={classNames(
                        "w-full rounded px-3 py-2 text-left text-sm",
                        active ? "bg-white/10 text-white" : "text-gray-200",
                      )}
                    >
                      History
                    </button>
                  )}
                  </Menu.Item>
                </Menu.Items>
              </Menu>
          </Tab.List>

          <Tab.Panels className="mt-3">
            <Tab.Panel>
              <LivePhase />
            </Tab.Panel>
            <Tab.Panel>
              <Rankings />
            </Tab.Panel>
            <Tab.Panel>
              <QualifierRankings />
            </Tab.Panel>
            <Tab.Panel>
              <TournamentSettings controls={false} />
            </Tab.Panel>
          </Tab.Panels>
        </>
      </Tab.Group>
    </div>
  );
}
