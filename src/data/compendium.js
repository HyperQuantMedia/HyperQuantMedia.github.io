// The Compendium: a browsable rendering of HQM-Compendium's public catalog
// (github.com/HyperQuantMedia/HQM-Compendium), transcribed from its README.
//
// THE README IS THE SOURCE OF TRUTH. Edit the catalog there first, then
// mirror the change here — this file is presentation, not canon.
//
// Entry shape, uniform across kinds:
//   {
//     name, url,            // the tool and its own site
//     capability,           // the job it does — entries group under jobs, not brands
//     cost,                 // cost tier, from the vendor's own pages
//     platforms,            // optional — 'Win, macOS, Linux' style string
//     language,             // optional — libraries only
//     status,               // 'Liked' | 'Watching'
//     link: { label, url }, // the download / repo / site pointer
//     note,                 // one line on why it earns the row
//     verify: true,         // optional — carries the README's VERIFY mark:
//                           //   the tier or platform is unconfirmed, not a guess
//   }
//
// The independence rules from the README are rendered on the page and are
// load-bearing: no affiliate links, no sponsorship, no mandate, no
// endorsement claimed or implied. Keep them intact.

// The status vocabulary comes from the README's own legend; the page
// renders these as tooltips so the labels explain themselves.
export const statusMeaning = {
  Liked: 'Used here, or used enough that we reach for it',
  Watching: 'Promising but unsettled — new, in beta, or repricing',
};

// Whether the Liked / Watching chip renders on each card. OFF on the owner's
// call: the distinction reads as a rating to a visitor who has not met the
// legend, and a landscape that is explicitly "not an endorsement for hire"
// should not have the loudest thing on every card look like a score.
//
// A flag rather than a CSS `display: none`, and rather than deleting the
// markup. Hidden text is still text: 306 cards' worth of "Liked" and
// "Watching" would stay in the HTML for a crawler to read on the site's
// largest content page while no visitor could see it, which is the one shape
// of hidden content worth avoiding. The `status` field stays in the data below
// and statusMeaning stays exported, so turning this back to `true` is the
// whole change.
export const showStatus = false;

export const kinds = [
  {
    key: 'apps',
    label: 'Applications',
    blurb: 'Software you install and run.',
    sections: [
      {
        name: 'Video and playback',
        entries: [
          { name: 'OBS Studio', url: 'https://obsproject.com/', capability: 'Screen and video recording, streaming', cost: 'Free (OSS, GPLv2)', platforms: 'Win, macOS, Linux', status: 'Liked', link: { label: 'Download', url: 'https://obsproject.com/download' }, note: 'Scene compositing and capture in one tool' },
          { name: 'Blick', url: 'https://blickeditor.com/', capability: 'Video editing', cost: 'Free beta', platforms: '', status: 'Watching', link: { label: 'Site', url: 'https://blickeditor.com/' }, note: 'In beta; tier provisional and expected to change at release', verify: true },
          { name: 'Adobe Premiere Pro', url: 'https://www.adobe.com/products/premiere.html', capability: 'Video editing', cost: 'Paid (subscription)', platforms: 'Win, macOS', status: 'Liked', link: { label: 'Via Creative Cloud', url: 'https://www.adobe.com/products/premiere.html' }, note: 'The industry baseline for timeline editing' },
          { name: 'VLC', url: 'https://www.videolan.org/', capability: 'Video playback', cost: 'Free (OSS, GPLv2)', platforms: 'Win, macOS, Linux, mobile', status: 'Liked', link: { label: 'Download', url: 'https://www.videolan.org/vlc/#download' }, note: 'Broad codec coverage built in; no codec packs needed' },
        ],
      },
      {
        name: 'Image and 3D',
        entries: [
          { name: 'Adobe Photoshop', url: 'https://www.adobe.com/products/photoshop.html', capability: 'Raster image editing', cost: 'Paid (subscription)', platforms: 'Win, macOS', status: 'Liked', link: { label: 'Via Creative Cloud', url: 'https://www.adobe.com/products/photoshop.html' }, note: 'Creative Cloud' },
          { name: 'Krita', url: 'https://krita.org/', capability: 'Digital painting', cost: 'Free (OSS, GPLv3)', platforms: 'Win, macOS, Linux', status: 'Liked', link: { label: 'Download', url: 'https://krita.org/en/download/' }, note: 'Painting-first; built for brushwork rather than photo retouching' },
          { name: 'GIMP', url: 'https://www.gimp.org/', capability: 'Raster image editing', cost: 'Free (OSS, GPLv3)', platforms: 'Win, macOS, Linux', status: 'Liked', link: { label: 'Download', url: 'https://www.gimp.org/downloads/' }, note: 'General image and asset editing' },
          { name: 'Blender', url: 'https://www.blender.org/', capability: '3D modelling, rigging, animation', cost: 'Free (OSS, GPLv3)', platforms: 'Win, macOS, Linux', status: 'Liked', link: { label: 'Download', url: 'https://www.blender.org/download/' }, note: 'Full 3D pipeline in one application' },
        ],
      },
      {
        name: 'Files and comparison',
        entries: [
          { name: 'File Pilot', url: 'https://filepilot.tech/', capability: 'File explorer replacement', cost: 'Free beta', platforms: 'Win', status: 'Watching', link: { label: 'Site', url: 'https://filepilot.tech/' }, note: 'Built for speed; vendor signals a paid tier after beta', verify: true },
          { name: 'Beyond Compare', url: 'https://www.scootersoftware.com/', capability: 'File and directory comparison', cost: 'Paid (one-time)', platforms: 'Win, macOS, Linux', status: 'Liked', link: { label: 'Download', url: 'https://www.scootersoftware.com/download' }, note: 'Three-way merge and folder synchronisation' },
          { name: 'WinMerge', url: 'https://winmerge.org/', capability: 'File and directory comparison', cost: 'Free (OSS, GPLv2)', platforms: 'Win', status: 'Liked', link: { label: 'Download', url: 'https://winmerge.org/downloads/' }, note: 'Windows only' },
          { name: 'Meld', url: 'https://meldmerge.org/', capability: 'File and directory comparison', cost: 'Free (OSS, GPLv2)', platforms: 'Win, macOS, Linux', status: 'Liked', link: { label: 'Download', url: 'https://meldmerge.org/' }, note: 'The cross-platform free option' },
        ],
      },
      {
        name: 'System utilities',
        entries: [
          { name: 'Task Slinger', url: 'https://taskslinger.net/', capability: 'Task Manager replacement', cost: 'Free open beta', platforms: 'Win 10, Win 11 x64', status: 'Watching', link: { label: 'Site', url: 'https://taskslinger.net/' }, note: 'Open beta since May 2026; confirm the tier on the site before relying on it', verify: true },
          { name: 'NextGen Task', url: 'https://nextgentask.co.in/product', capability: 'Task and work management, performance tracking', cost: 'Freemium', platforms: 'Web', status: 'Watching', link: { label: 'Web app — no install', url: 'https://nextgentask.co.in/product' }, note: 'A work-management platform rather than a Windows Task Manager replacement', verify: true },
          { name: 'Microsoft PowerToys', url: 'https://github.com/microsoft/PowerToys', capability: 'Windows power utilities', cost: 'Free (OSS, MIT)', platforms: 'Win', status: 'Liked', link: { label: 'Releases', url: 'https://github.com/microsoft/PowerToys/releases' }, note: 'FancyZones, PowerRename, Run, and more in one install' },
        ],
      },
      {
        name: 'Source control',
        entries: [
          { name: 'GitHub', url: 'https://github.com/', capability: 'Repository hosting and CI', cost: 'Freemium', platforms: 'Web', status: 'Liked', link: { label: 'Web app — no install', url: 'https://github.com/' }, note: 'Hosting and automation, not a desktop client' },
          { name: 'Sourcetree', url: 'https://www.sourcetreeapp.com/', capability: 'Git GUI client', cost: 'Free (proprietary)', platforms: 'Win, macOS', status: 'Liked', link: { label: 'Download', url: 'https://www.sourcetreeapp.com/' }, note: 'No Linux build' },
          { name: 'Tower', url: 'https://www.git-tower.com/', capability: 'Git GUI client', cost: 'Paid (subscription)', platforms: 'Win, macOS', status: 'Liked', link: { label: 'Download', url: 'https://www.git-tower.com/download' }, note: 'Undo-heavy workflow; strong conflict resolution' },
        ],
      },
      {
        name: 'Notes and Markdown',
        entries: [
          { name: 'Obsidian', url: 'https://obsidian.md/', capability: 'Markdown notes, local vault', cost: 'Free (proprietary), paid add-ons', platforms: 'Win, macOS, Linux, iOS, Android', status: 'Liked', link: { label: 'Download', url: 'https://obsidian.md/download' }, note: 'Free for personal and commercial use; the vault is plain .md files on disk. Sync and Publish are paid add-ons. Closed source' },
        ],
      },
      {
        name: 'Profiling and performance analysis',
        intro: 'Vendor profilers are tied to the hardware they profile — pick by target platform, not preference.',
        entries: [
          { name: 'NVIDIA Nsight Systems', url: 'https://developer.nvidia.com/nsight-systems', capability: 'System-wide CPU/GPU timeline profiling', cost: 'Free (proprietary)', platforms: 'Win, Linux', status: 'Liked', link: { label: 'Download', url: 'https://developer.nvidia.com/nsight-systems' }, note: 'NVIDIA hardware; a developer account may be required' },
          { name: 'PIX on Windows', url: 'https://devblogs.microsoft.com/pix/', capability: 'GPU and CPU capture for DirectX 12', cost: 'Free (proprietary)', platforms: 'Win', status: 'Liked', link: { label: 'Download', url: 'https://devblogs.microsoft.com/pix/download/' }, note: 'Microsoft; the default for D3D12 GPU captures' },
          { name: 'Arm Streamline', url: 'https://developer.arm.com/Tools%20and%20Software/Streamline%20Performance%20Analyzer', capability: 'CPU/GPU performance analysis on Arm', cost: 'Free (proprietary)', platforms: 'Win, macOS, Linux', status: 'Liked', link: { label: 'Site', url: 'https://developer.arm.com/Tools%20and%20Software/Streamline%20Performance%20Analyzer' }, note: 'Ships within Arm Performance Studio; confirm the current licensing tier', verify: true },
          { name: 'Snapdragon Profiler', url: 'https://www.qualcomm.com/developer/software/snapdragon-profiler', capability: 'CPU/GPU/DSP profiling on Snapdragon', cost: 'Free (proprietary)', platforms: 'Win, macOS, Linux', status: 'Liked', link: { label: 'Site', url: 'https://www.qualcomm.com/developer/software/snapdragon-profiler' }, note: 'Qualcomm hardware; account registration expected', verify: true },
          { name: 'Android Studio Profiler', url: 'https://developer.android.com/studio/profile', capability: 'CPU, memory, energy, and network profiling', cost: 'Free (proprietary)', platforms: 'Win, macOS, Linux', status: 'Liked', link: { label: 'Docs', url: 'https://developer.android.com/studio/profile' }, note: 'Bundled with Android Studio, not a separate install' },
        ],
      },
      {
        name: 'Game engines and frameworks',
        entries: [
          { name: 'Luxe', url: 'https://luxeengine.com/', capability: '2D-focused game engine with its own editor', cost: 'Pay what you should', platforms: 'Win, macOS, Linux, Web', status: 'Watching', link: { label: 'Site', url: 'https://luxeengine.com/' }, note: 'C++ core scripted in Wren; in preview — expect movement before release', verify: true },
          { name: 'Naninovel', url: 'https://naninovel.com/', capability: 'Visual novels and interactive fiction in Unity', cost: 'Paid (one-time)', platforms: 'Wherever Unity ships', status: 'Liked', link: { label: 'Site', url: 'https://naninovel.com/' }, note: 'Writer-first tooling — scripting, save/load, rollback, localization built in; sold via the Unity Asset Store', verify: true },
        ],
      },
      {
        name: 'Education and simulation',
        entries: [
          { name: 'Algodoo', url: 'https://www.algodoo.com/', capability: '2D physics sandbox', cost: 'Free (proprietary)', platforms: 'Win, macOS, iPad', status: 'Liked', link: { label: 'Download', url: 'https://www.algodoo.com/' }, note: 'Formerly commercial, now free' },
          { name: 'Crayon Physics Deluxe', url: 'https://store.steampowered.com/app/2600/Crayon_Physics_Deluxe/', capability: 'Physics puzzle sandbox', cost: 'Paid (one-time)', platforms: 'Win', status: 'Liked', link: { label: 'Steam', url: 'https://store.steampowered.com/app/2600/Crayon_Physics_Deluxe/' }, note: 'Draw-to-solve physics; a teaching toy as much as a game' },
          { name: 'ChemLab', url: 'https://modelscience.com/', capability: 'Virtual chemistry lab simulation', cost: 'Paid (one-time)', platforms: 'Win, macOS', status: 'Liked', link: { label: 'Trial', url: 'https://modelscience.com/' }, note: 'Model Science Software; free trial, pricing not published on the landing page', verify: true },
          { name: 'JFLAP', url: 'https://www.jflap.org/', capability: 'Automata, grammars, and formal-language simulation', cost: 'Free (source-available)', platforms: 'Any with Java 8', status: 'Liked', link: { label: 'Download', url: 'https://www.jflap.org/' }, note: 'Not an OSI-approved licence: modification for personal use, resale prohibited. Use 7.1; the version 8 beta was never finished' },
        ],
      },
    ],
  },
  {
    key: 'libs',
    label: 'Libraries',
    blurb: 'Engine-agnostic source dependencies — the licence decides whether you can ship it, and every licence is read from the repository itself, never inferred.',
    sections: [
      {
        name: 'Physics',
        entries: [
          { name: 'Box2D', url: 'https://box2d.org/', capability: '2D rigid-body physics', cost: 'Free (OSS, MIT)', language: 'C', status: 'Liked', link: { label: 'Repo', url: 'https://github.com/erincatto/box2d' }, note: 'The reference 2D physics engine; by Erin Catto' },
          { name: 'Box3D', url: 'https://github.com/erincatto/box3d', capability: '3D rigid-body physics', cost: 'Free (OSS, MIT)', language: 'C', status: 'Liked', link: { label: 'Repo', url: 'https://github.com/erincatto/box3d' }, note: "Box2D's 3D sibling, same author" },
        ],
      },
      {
        name: 'Upscaling and super resolution',
        entries: [
          { name: 'Arm Accuracy Super Resolution', url: 'https://github.com/arm/accuracy-super-resolution', capability: 'Temporal upscaling for mobile GPUs', cost: 'Free (OSS, MIT)', language: 'C', status: 'Liked', link: { label: 'Repo', url: 'https://github.com/arm/accuracy-super-resolution' }, note: 'Arm ASR; the engine-agnostic implementation' },
          { name: 'Snapdragon Game Super Resolution', url: 'https://github.com/SnapdragonGameStudios/snapdragon-gsr', capability: 'Spatial upscaling shader', cost: 'Free (OSS, BSD 3-Clause)', language: 'GLSL', status: 'Liked', link: { label: 'Repo', url: 'https://github.com/SnapdragonGameStudios/snapdragon-gsr' }, note: 'Qualcomm GSR; single-pass shader, engine-agnostic' },
          { name: 'AMD FidelityFX SDK', url: 'https://gpuopen.com/fidelityfx-sdk/', capability: 'Upscaling and effects SDK (FSR and kin)', cost: 'Free (OSS, MIT)', language: 'C++', status: 'Liked', link: { label: 'Repo', url: 'https://github.com/GPUOpen-LibrariesAndSDKs/FidelityFX-SDK' }, note: 'Licence declared in docs/license.md, not a root licence file' },
        ],
      },
      {
        name: 'Debugging and profiling',
        entries: [
          { name: 'RenderDoc', url: 'https://renderdoc.org/', capability: 'Frame capture and graphics debugging', cost: 'Free (OSS, MIT)', language: 'C++', status: 'Liked', link: { label: 'Repo', url: 'https://github.com/baldurk/renderdoc' }, note: 'Stand-alone tool; captures and replays frames across APIs' },
          { name: 'Tracy', url: 'https://github.com/wolfpld/tracy', capability: 'Frame and CPU/GPU profiling', cost: 'Free (OSS, BSD 3-Clause)', language: 'C++', status: 'Liked', link: { label: 'Repo', url: 'https://github.com/wolfpld/tracy' }, note: 'Real-time, nanosecond-resolution frame profiler' },
        ],
      },
      {
        name: 'UI',
        entries: [
          { name: 'Dear ImGui', url: 'https://github.com/ocornut/imgui', capability: 'Immediate-mode debug and tool UI', cost: 'Free (OSS, MIT)', language: 'C++', status: 'Liked', link: { label: 'Repo', url: 'https://github.com/ocornut/imgui' }, note: 'Bloat-free, minimal dependencies; the default for in-engine tooling' },
        ],
      },
    ],
  },
  {
    key: 'ue',
    label: 'Unreal Plugins',
    blurb: 'Drop-in plugins for an Unreal project. Check each plugin’s own repository for engine-version support before adopting it.',
    sections: [
      {
        name: 'Unreal Engine plugins',
        entries: [
          { name: 'Box3DUnreal', url: 'https://github.com/alattanzio/Box3DUnreal', capability: 'Box3D physics inside Unreal', cost: 'Free (OSS, MIT)', status: 'Liked', link: { label: 'Repo', url: 'https://github.com/alattanzio/Box3DUnreal' }, note: 'Community integration — not an official Box3D or Epic project' },
          { name: 'Arm ASR for Unreal', url: 'https://github.com/arm/accuracy-super-resolution-for-unreal', capability: 'Arm ASR temporal upscaling', cost: 'Free (OSS, MIT)', status: 'Liked', link: { label: 'Repo', url: 'https://github.com/arm/accuracy-super-resolution-for-unreal' }, note: 'Official Unreal integration of Arm ASR' },
          { name: 'Snapdragon game plugins for Unreal', url: 'https://github.com/SnapdragonGameStudios/snapdragon-game-plugins-for-unreal-engine', capability: 'Qualcomm mobile optimisation', cost: 'Free (OSS, BSD 3-Clause)', status: 'Liked', link: { label: 'Repo', url: 'https://github.com/SnapdragonGameStudios/snapdragon-game-plugins-for-unreal-engine' }, note: 'Plugins from Snapdragon Game Studios' },
        ],
      },
    ],
  },
  {
    key: 'vs',
    label: 'VS Extensions',
    blurb: 'Add-ins for Microsoft Visual Studio. Check each listing for which Visual Studio versions it supports.',
    sections: [
      {
        name: 'Visual Studio extensions',
        entries: [
          { name: 'Android Game Development Extension', url: 'https://developer.android.com/games/agde', capability: 'Build, deploy, and debug Android games from Visual Studio', cost: 'Free (proprietary)', status: 'Liked', link: { label: 'Site', url: 'https://developer.android.com/games/agde' }, note: 'Google AGDE; keeps an existing MSBuild C++ project targeting Android' },
          { name: 'VSColorOutput', url: 'https://marketplace.visualstudio.com/items?itemName=MikeWard-AnnArbor.VSColorOutput', capability: 'Colourises the build and debug output window', cost: 'Free', status: 'Liked', link: { label: 'Marketplace', url: 'https://marketplace.visualstudio.com/items?itemName=MikeWard-AnnArbor.VSColorOutput' }, note: 'Makes errors and warnings findable in build spew; confirm the licence on the listing', verify: true },
          { name: 'Visual Assist', url: 'https://www.wholetomato.com/en', capability: 'C++/C# navigation, refactoring, and code analysis', cost: 'Paid (subscription)', status: 'Liked', link: { label: 'Site', url: 'https://www.wholetomato.com/en' }, note: 'Whole Tomato; dedicated Unreal and Unity support. 30-day trial; free licences for students and educators', verify: true },
        ],
      },
    ],
  },
  {
    key: 'learn',
    label: 'Learning',
    blurb: 'Not software: reference sites, tutorial series, and books for graphics and rendering work. A free site may still point at a paid book.',
    sections: [
      {
        name: 'Learning resources',
        entries: [
          { name: 'Scratchapixel', url: 'https://www.scratchapixel.com/', capability: 'Rendering from first principles', cost: 'Free', platforms: 'Lesson series', status: 'Liked', link: { label: 'Site', url: 'https://www.scratchapixel.com/' }, note: 'Builds the maths before the code; the usual first recommendation' },
          { name: 'Ray Tracing in One Weekend', url: 'https://raytracing.github.io/', capability: 'Ray tracing, path tracing, and the rest of the series', cost: 'Free', platforms: 'Book series', status: 'Liked', link: { label: 'Site', url: 'https://raytracing.github.io/' }, note: 'Peter Shirley and co-authors; read online or build the code alongside' },
          { name: 'Real-Time Rendering', url: 'https://www.realtimerendering.com/', capability: 'The real-time rendering field, broadly', cost: 'Free portal, paid book', platforms: 'Portal and book', status: 'Liked', link: { label: 'Site', url: 'https://www.realtimerendering.com/' }, note: 'Companion site to the book — the resource lists are free; the book is not' },
          { name: '3D Game Engine Programming', url: 'https://www.3dgep.com/', capability: 'DirectX 12, engine architecture', cost: 'Free', platforms: 'Article series', status: 'Liked', link: { label: 'Site', url: 'https://www.3dgep.com/' }, note: 'Long-form DirectX 12 walkthroughs' },
          { name: 'RasterTek', url: 'https://www.rastertek.com/tutindex.html', capability: 'DirectX 11 and 12 tutorials', cost: 'Free', platforms: 'Tutorial series', status: 'Liked', link: { label: 'Site', url: 'https://www.rastertek.com/tutindex.html' }, note: 'Step-by-step and code-first; older but methodical' },
          { name: 'Graphics Programming Weekly', url: 'https://www.jendrikillner.com/', capability: 'Weekly digest of graphics programming articles', cost: 'Free', platforms: 'Article digest', status: 'Liked', link: { label: 'Site', url: 'https://www.jendrikillner.com/' }, note: 'Jendrik Illner’s roundup — the standing answer to “how do I keep up”' },
          { name: 'Wicked Engine Devblog', url: 'https://turanszkij.wordpress.com/category/devblog/', capability: 'Engine and graphics implementation write-ups', cost: 'Free', platforms: 'Devblog', status: 'Liked', link: { label: 'Site', url: 'https://turanszkij.wordpress.com/category/devblog/' }, note: 'János Turánszki’s notes from building Wicked Engine in the open' },
        ],
      },
    ],
  },
];

export const entryCount = kinds.reduce(
  (n, k) => n + k.sections.reduce((m, s) => m + s.entries.length, 0),
  0,
);
