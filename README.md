[Korean Document](/README_ko.md)

This Project has been deprecated.
Check new version [video-skip-silent](https://github.com/kimjisub/video-skip-silent)

# Silent-Cutter

Edit the video using sound volume.

## System Requirements

[nodejs](https://nodejs.org/), [FFmpeg](https://www.ffmpeg.org/)

If both programs are not installed, the operation of the program cannot be guaranteed.

## How to use

```
node index -i input.mp4 -o output.mp4 -db "-50"
```

```
usage: index [-h] [-v] [-i PATH] [-o PATH] [-c CHUNK_SIZE] [-s SOUNDED_SPEED] [-ns SILENT_SPEED] [-db STANDARD_dB] [-vrr RANGE] [-srr RANGE ] [-vrm METHOD] [-srm METHOD] [-d DEBUG]

Cut Video by Silence

Optional arguments:
  -h, --help Show this help message and exit.
  -v, --version Show program's version number and exit.
  -i PATH Input file. (Default: input.mp4)
  -o PATH Output file. (Default: output.mp4)
  -c CHUNK_SIZE Sound chunk size in sec. (Default: sec of 1 frame)
  -s SOUNDED_SPEED Set sounded part speed. (Default: 1)
  -ns SILENT_SPEED Set silent part speed. (Default: Inf)
  db STANDARD_dB Set standard dB for recognition. (Default: -50)
  -vrr RANGE Set volume round range in chunk. (Default: 3)
  -srr RANGE Set sounded round range in chunk. (Default: 10)
  -vrm METHOD Set volume round method. (Default: 3)
  -srm METHOD Set sounded round method. (Default: 1)
  -d DEBUG Show Debug web page. (Default: true)
```

## how it works

### 1. Extract Sound by Chunk

Extract sound files at intervals of `CHUNK_SIZE`. It is stored in `workspace/sounds/`.

### 2.Get Volume of Each Chunk

Gets the sound volume from each sound chunk. This operation is cached and speeds up when the same video is processed more than once.

### 3.Reformat Video (mp4, keyframe)

Change to the state for editing video files. Convert keyframe 1 to mp4 format. It is stored in `workspace/keyedited.mp4`.

### 4.Split and Speeding Videos

Crop the image to the standard and adjust the speed. It is stored in `workspace/videos/`.

### 5.Merge All Part to One Video

Merge the cropped footage into one video. It is stored in `OUTPUT`.
