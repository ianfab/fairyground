document.addEventListener("onpageload", () => {
  const pagetitle = document.getElementById("pagetitle");
  const dropdown_whitetimemode = document.getElementById(
    "dropdown-whitetimemode",
  );
  const dropdown_blacktimemode = document.getElementById(
    "dropdown-blacktimemode",
  );
  pagetitle.innerText = "Play against Fairy-Stockfish";
  dropdown_whitetimemode.selectedIndex = 1;
  dropdown_blacktimemode.selectedIndex = 1;
  dropdown_whitetimemode.dispatchEvent(new Event("change"));
  dropdown_blacktimemode.dispatchEvent(new Event("change"));
});
