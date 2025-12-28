"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { driver } from "driver.js";

const TOUR_STORAGE_KEY = "veritas_teacher_tour_v1";

export function TeacherTour() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/dashboard") return;
    if (typeof window === "undefined") return;
    if (localStorage.getItem(TOUR_STORAGE_KEY) === "done") return;

    const startAnchor = document.querySelector('[data-tour="create-class"]');
    if (!startAnchor) return;

    const tour = driver({
      showProgress: true,
      allowClose: true,
      steps: [
        {
          element: '[data-tour="create-class"]',
          popover: {
            title: "Create your first class",
            description: "Start here to set up a class roster and invite students.",
            side: "bottom",
            align: "center",
          },
        },
        {
          element: '[data-tour="nav-classes"]',
          popover: {
            title: "Manage classes",
            description: "Add students, share access codes, and track roster changes.",
            side: "bottom",
            align: "center",
          },
        },
        {
          element: '[data-tour="nav-assessments"]',
          popover: {
            title: "Build assessments",
            description: "Create or upload assessments, then publish to your classes.",
            side: "bottom",
            align: "center",
          },
        },
        {
          element: '[data-tour="dashboard-stats"]',
          popover: {
            title: "Track what needs attention",
            description: "Quick stats highlight pending reviews and completion rate.",
            side: "bottom",
            align: "center",
          },
        },
        {
          element: '[data-tour="nav-help"]',
          popover: {
            title: "Get support anytime",
            description: "Jump to help docs or contact support from here.",
            side: "bottom",
            align: "center",
          },
        },
      ],
      onDestroyed: () => {
        localStorage.setItem(TOUR_STORAGE_KEY, "done");
      },
    });

    const timeout = window.setTimeout(() => {
      tour.drive();
    }, 350);

    return () => {
      window.clearTimeout(timeout);
      tour.destroy();
    };
  }, [pathname]);

  return null;
}
