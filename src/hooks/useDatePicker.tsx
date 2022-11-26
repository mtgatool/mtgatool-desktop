import "react-day-picker/lib/style.css";

import { useCallback, useMemo, useState } from "react";
import DayPicker from "react-day-picker";

export default function useDatePicker(
  initialDate: Date,
  editCallback?: (currentDate: Date) => void,
  closeCallback?: (currentDate: Date) => void
): [Date, () => void, JSX.Element, (newDate: Date) => void] {
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [show, setShow] = useState(false);

  const handleClose = useCallback(
    (e) => {
      e.stopPropagation();
      setShow(false);
      if (closeCallback) {
        closeCallback(currentDate);
      }
    },
    [closeCallback, currentDate]
  );

  const handleOnChange = useCallback(
    (newTime: Date) => {
      setCurrentDate(newTime);
      if (editCallback) {
        editCallback(newTime);
      }
    },
    [editCallback]
  );

  const doShow = useCallback(() => {
    setShow(true);
  }, []);

  const elem = useMemo((): JSX.Element => {
    return show ? (
      <div className="picker-background" onClick={handleClose}>
        <div
          className="picker-div"
          style={{
            backgroundColor: "var(--color-section)",
            borderRadius: "2px",
            width: "360px",
            height: "360px",
            display: "flex",
          }}
          onClick={(e): void => {
            e.stopPropagation();
          }}
        >
          <DayPicker
            selectedDays={currentDate}
            onDayClick={handleOnChange}
            todayButton="Today"
          />
        </div>
      </div>
    ) : (
      <></>
    );
  }, [show, currentDate, handleClose, handleOnChange]);

  return [currentDate, doShow, elem, setCurrentDate];
}
