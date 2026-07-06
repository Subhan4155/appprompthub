"use client";

import React, { useEffect, useState } from "react";

export default function Preloader() {
  const [show, setShow] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const startTime = Date.now();

    const triggerHide = () => {
      const elapsed = Date.now() - startTime;
      const minDuration = 2200; // 2.2 seconds minimum duration
      const delay = Math.max(0, minDuration - elapsed);

      setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => setShow(false), 500);
      }, delay);
    };

    if (document.readyState === "complete") {
      triggerHide();
    } else {
      window.addEventListener("load", triggerHide);
      const fallbackTimeout = setTimeout(triggerHide, 4000);
      return () => {
        window.removeEventListener("load", triggerHide);
        clearTimeout(fallbackTimeout);
      };
    }
  }, []);

  if (!show) return null;

  return (
    <div
      id="site-preloader"
      style={{
        opacity: fadeOut ? 0 : 1,
        visibility: fadeOut ? "hidden" : "visible",
        transition: "opacity 0.5s ease, visibility 0.5s ease",
      }}
    >
      <div className="preloader-inner">
        <img
          src="/logo-mark.png"
          alt="Logo"
          className="preloader-logo"
          style={{ height: "80px", width: "auto" }}
        />
        <div className="preloader-bar-container">
          <div className="preloader-bar"></div>
        </div>
      </div>
    </div>
  );
}
