// ═══════════════════════════════════════════════════════════
// stitch-p3-boss.cjs
// Concatenates individual P3 conversation lines into single MP3 files
// with a 0.8s silence gap between lines
//
// Prerequisites: ffmpeg must be installed
// Usage: node scripts/stitch-p3-boss.cjs
//
// Input:  public/audio/boss/p3_01_0.mp3, p3_01_1.mp3, ...
// Output: public/audio/boss/p3_01.mp3, p3_02.mp3, ...
// ═══════════════════════════════════════════════════════════

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const AUDIO_DIR = path.join(__dirname, "..", "public", "audio", "boss");
const SILENCE_MS = 800; // gap between lines
const CONVOS = 13;      // bp3_01 through bp3_13
const LINES_PER = 4;    // 4 lines per conversation

// Generate a silence file
const silenceFile = path.join(AUDIO_DIR, "_silence.mp3");
if (!fs.existsSync(silenceFile)) {
  console.log("Generating silence gap...");
  execSync(`ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t ${SILENCE_MS / 1000} -q:a 9 "${silenceFile}" -y`, { stdio: "inherit" });
}

for (let c = 1; c <= CONVOS; c++) {
  const id = String(c).padStart(2, "0");
  const outFile = path.join(AUDIO_DIR, `p3_${id}.mp3`);

  if (fs.existsSync(outFile)) {
    console.log(`⏭ SKIP p3_${id}.mp3 (exists)`);
    continue;
  }

  // Build concat list
  const listFile = path.join(AUDIO_DIR, `_concat_${id}.txt`);
  let listContent = "";
  for (let i = 0; i < LINES_PER; i++) {
    const lineFile = path.join(AUDIO_DIR, `p3_${id}_${i}.mp3`);
    if (!fs.existsSync(lineFile)) {
      console.error(`❌ Missing: p3_${id}_${i}.mp3`);
      break;
    }
    if (i > 0) listContent += `file '${silenceFile}'\n`;
    listContent += `file '${lineFile}'\n`;
  }

  fs.writeFileSync(listFile, listContent);
  try {
    execSync(`ffmpeg -f concat -safe 0 -i "${listFile}" -c copy "${outFile}" -y`, { stdio: "inherit" });
    console.log(`✅ p3_${id}.mp3`);
  } catch (e) {
    console.error(`❌ Failed to stitch p3_${id}: ${e.message}`);
  }
  fs.unlinkSync(listFile); // cleanup
}

// Cleanup silence file
if (fs.existsSync(silenceFile)) fs.unlinkSync(silenceFile);
console.log("\n✅ All P3 conversations stitched!");
