import { useState } from "react";

export default function NotesPanel() {

  const [notes, setNotes] = useState("");

  return (

    <div className="
      bg-white
      dark:bg-dark-card
      border
      border-light-border dark:border-dark-border
      rounded-xl
      p-4
    ">

      <h3 className="font-semibold mb-2">
        Panel Notes
      </h3>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Write interviewer notes..."
        className="
        w-full
        h-[200px]
        resize-none
        outline-none
        bg-transparent
        text-sm
        "
      />

    </div>

  );

}