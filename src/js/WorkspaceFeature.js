/* Arrange the existing Mithril controls before mounting. IDs, event handlers and
 * hidden states stay on their original nodes; no live DOM nodes are moved. */
window.FairygroundWorkspace = (m, content) => {
  const take = (nodes, id) => {
    const index = nodes.findIndex((node) => node?.attrs?.id === id);
    return index < 0 ? null : nodes.splice(index, 1)[0];
  };
  const disclosure = (title, children, attrs = {}) =>
    m("details.workspace-section", attrs, [
      m("summary", title),
      m("div.section-content", children),
    ]);
  const header = take(content, "pageheader");
  const imports = take(header.children, "misc");
  const links = take(content, "links");
  links.tag = "nav";
  links.attrs["aria-label"] = "Main navigation";
  links.children.forEach((link) => {
    link.attrs.target = "_self";
    const current = location.pathname.endsWith("advanced.html")
      ? "advanced"
      : "play";
    if (link.children?.[0]?.children === current) {
      link.attrs["aria-current"] = "page";
    }
  });
  header.children.unshift(
    m("a.workspace-brand[href='./index.html'][target='_self']", [
      m("span.brand-mark[aria-hidden=true]", "♞"),
      m("span", "fairyground"),
    ]),
  );
  header.children.push(links);

  const variants = take(content, "posvariantdiv");
  const variantInfo = take(variants.children, "aboutvariant");
  const parser = variants.children.pop();
  const customPositions = variants.children.splice(4);
  variants.children.push(
    variantInfo,
    parser,
    disclosure("Starting position", customPositions, {
      class: "position-options",
    }),
  );

  const outputs = take(content, "outputs");
  const board = outputs.children[0];
  board.attrs = { ...board.attrs, class: "board-surface" };
  const appearance = take(board.children, "controls");
  const flip = take(appearance.children[0].children, "button-flip");
  const position = take(content, "input");
  board.children.unshift(m("div.board-toolbar", [m("h2", "Board"), flip]));
  board.children.push(position);

  const info = outputs.children[1];
  const consoleOutput = take(info.children, "output2");
  const consoleCommands = take(info.children, "enginecmddiv");
  const notation = take(info.children, "sannotation");
  info.children.unshift(m("h2", "Game & analysis"));
  info.children.push(
    disclosure(
      "Notation & position",
      [notation, take(info.children, "currentboardfen")],
      { class: "analysis-only" },
    ),
  );
  info.children.push(
    disclosure("Engine console", [consoleOutput, consoleCommands], {
      class: "analysis-only",
    }),
  );

  const settings = take(content, "input2");
  const extraPlayers = settings.children.filter(
    (node) =>
      node.tag === "label" &&
      node.children?.some((child) =>
        ["randommoverwhite", "randommoverblack"].includes(child.attrs?.id),
      ),
  );
  settings.children = settings.children.filter(
    (node) => !extraPlayers.includes(node),
  );
  // Separate search limits from frequently used play/analysis actions.
  const limits = [
    "depth",
    "movetime",
    "nodes",
    "threads",
    "hash",
    "multipv",
  ].map((id) => take(settings.children, id));
  settings.children.shift(); // Redundant "Settings:" heading.
  const names = [
    "Depth",
    "Time / move (ms)",
    "Nodes",
    "Threads",
    "Hash (MB)",
    "Engine lines",
  ];
  const search = disclosure(
    "Engine settings",
    limits.map((input, index) =>
      m("label.workspace-field", [m("span", names[index]), input]),
    ),
    { class: "analysis-only" },
  );
  const times = take(content, "advancedtimesettings");
  const timeControls = take(times.children, "gamecontrol-start");
  times.children.forEach((side) => {
    side.children = side.children.map((node) =>
      node.tag === "input"
        ? m("label.workspace-field", { hidden: node.attrs.hidden }, [
            m("span", node.attrs.placeholder),
            node,
          ])
        : node,
    );
  });
  timeControls.children = [
    timeControls.children[0],
    disclosure("Time control help", timeControls.children.slice(1)),
  ];
  times.children = [disclosure("Time control", times.children), timeControls];
  const game = m(
    "section.game-panel",
    { hidden: settings.attrs.hidden && times.attrs.hidden },
    [m("h2", "Play & explore"), settings, search, times],
  );
  outputs.children[1] = m("div.workspace-sidebar", [game, info]);

  const options = m("section.workspace-options[aria-label='More options']", [
    disclosure("Game options", [
      m("div", extraPlayers),
      take(content, "input3"),
      take(content, "gamesettings"),
      take(content, "visualeffects"),
    ]),
    disclosure("Board & appearance", [appearance]),
    disclosure("Files & engines", [imports, take(content, "binengineinput")]),
  ]);

  // Give existing icon-only controls and placeholder-only inputs accessible names.
  const nameControls = (node) => {
    if (!node || typeof node !== "object") return;
    if (["button", "input", "select", "textarea"].includes(node.tag)) {
      const attrs = node.attrs || (node.attrs = {});
      if (!attrs["aria-label"] && (attrs.title || attrs.placeholder)) {
        attrs["aria-label"] = attrs.title || attrs.placeholder;
      }
    }
    if (Array.isArray(node.children)) node.children.forEach(nameControls);
  };
  const layout = [
    header,
    m("section.variant-panel[aria-label='Variant and starting position']", [
      variants,
    ]),
    take(content, "boardsetupsettings"),
    take(content, "enginematch"),
    outputs,
    options,
    ...content,
  ];
  layout.forEach(nameControls);
  return m(
    "main.workspace",
    {
      oncreate: ({ dom }) => {
        const container = dom.querySelector("#chessground-container-div");
        // Match the dimensions in generated.css, including rectangular variants
        // and the extra room reserved for pockets, at a responsive board size.
        const sizeBoard = () => {
          const match = container.className.match(/\bboard(\d+)x(\d+)\b/);
          if (!match) return;
          const files = Number(match[1]);
          const ranks = Number(match[2]);
          container.style.setProperty("--workspace-files", files);
          container.style.setProperty("--workspace-ranks", ranks);
          container.style.setProperty(
            "--workspace-units",
            Math.max(files, ranks) +
              (container.classList.contains("pockets") ? 2 : 0),
          );
        };
        sizeBoard();
        dom.workspaceObserver = new MutationObserver(sizeBoard);
        dom.workspaceObserver.observe(container, {
          attributes: true,
          attributeFilter: ["class"],
        });
      },
      onremove: ({ dom }) => dom.workspaceObserver?.disconnect(),
    },
    layout,
  );
};
