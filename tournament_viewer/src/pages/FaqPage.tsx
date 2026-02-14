import { Link } from "react-router-dom";

export default function FaqPage() {
  return (
    <div className="space-y-6 text-white">
      <h1 className="text-3xl font-bold theme-text">FAQ</h1>

      <section className="rounded-xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-xl font-semibold theme-text">Registration</h2>
        <div className="mt-2 space-y-2 text-sm text-gray-200">
          <p>
            Tickets are required for everyone visiting the event. If you only
            come for one day, use the day/spectator option.
            {" "}
            <a
              href="https://rhythmtechnologies.nl/product/itg-eurocup-2026-spectator-day-ticket/"
              target="_blank"
              rel="noreferrer"
              className="underline text-white"
            >
              Spectator day ticket
            </a>
            .
          </p>
          <p>
            If you want to attend multiple days or compete in tournaments, get
            a full ticket (
            <a
              href="https://rhythmtechnologies.nl/product/itg-eurocup-2026-ticket/"
              target="_blank"
              rel="noreferrer"
              className="underline text-white"
            >
              buy here
            </a>
            ).
          </p>
          <p>
            During ticket checkout you can select tournament participation. If
            you are not competing, leave tournament checkboxes empty.
          </p>
          <p>
            Anonymous registration is available for players who do not want
            their tag posted online.
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-xl font-semibold theme-text">How To Use /tournament</h2>
        <div className="mt-2 space-y-2 text-sm text-gray-200">
          <p>
            Open <span className="font-semibold text-white">/tournament</span>{" "}
            for live event data or use this direct route:
            {" "}
            <Link to="/tournament" className="underline text-white">
              /tournament
            </Link>
            .
          </p>
          <p>
            Tabs show live match state, rankings, qualifier rankings, and
            history.
          </p>
          <p>
            This page is read-focused for spectators and competitors following
            the event.
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-xl font-semibold theme-text">Event Info (Eurocup 2026)</h2>
        <div className="mt-2 space-y-2 text-sm text-gray-200">
          <p>
            Date: Thursday, June 11, 2026 to Sunday, June 14, 2026.
          </p>
          <p>
            Venue: Pixel Arcade in Den Bosch (
            <a
              href="https://pixelarcade.nl/"
              target="_blank"
              rel="noreferrer"
              className="underline text-white"
            >
              pixelarcade.nl
            </a>
            ).
          </p>
          <p>
            The full venue is booked for Eurocup, so freeplay is included in
            your ticket.
          </p>
          <p>
            Tickets support most payment methods. Day/spectator tickets are
            available, and full tickets are required for multi-day attendance
            or tournament participation.
          </p>
          <p>
            Supporter tickets and event t-shirts are available if you want to
            help improve the event experience.
          </p>
          <p>
            More information will follow soon. For updates, join Discord:
            {" "}
            <a
              href="https://discord.gg/nMYvzJqCvN"
              target="_blank"
              rel="noreferrer"
              className="underline text-white"
            >
              discord.gg/nMYvzJqCvN
            </a>
            . Official event page:
            {" "}
            <a
              href="https://itgeurocup.com/"
              target="_blank"
              rel="noreferrer"
              className="underline text-white"
            >
              itgeurocup.com
            </a>
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-xl font-semibold theme-text">Useful Links</h2>
        <ul className="mt-2 space-y-2 text-sm text-gray-200">
          <li>
            <a
              href="https://rhythmtechnologies.nl/product/itg-eurocup-2026-ticket/"
              target="_blank"
              rel="noreferrer"
              className="underline text-white"
            >
              Full ticket
            </a>
          </li>
          <li>
            <a
              href="https://rhythmtechnologies.nl/product/itg-eurocup-2026-spectator-day-ticket/"
              target="_blank"
              rel="noreferrer"
              className="underline text-white"
            >
              Spectator day ticket
            </a>
          </li>
          <li>
            <a
              href="https://itgeurocup.com/"
              target="_blank"
              rel="noreferrer"
              className="underline text-white"
            >
              Official event site
            </a>
          </li>
          <li>
            <Link to="/tournament" className="underline text-white">
              Tournament live page
            </Link>
          </li>
        </ul>
      </section>
    </div>
  );
}
