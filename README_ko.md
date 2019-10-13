# Silent-Cutter

## 소개
소리의 크기를 이용하여 동영상을 편집합니다.

## 시스템 요구사항

[nodejs](https://nodejs.org/), [FFmpeg](https://www.ffmpeg.org/)

## 작동 방식

### 1. Extract Sound by Chunk
영상으로부터 사운드 파일을 청크 단위로 추출합니다.

### 2. Get Volume of Each Chunk
각 사운드 청크로부터 소리 볼륨을 가져옵니다. 이 값은 캐싱이 되며, 같은 영상을 2번 이상 처리하게 되면 속도가 향상됩니다.

### 3. Reformat Video (mp4, keyframe)
비디오파일을 편집하기 위한 상태로 변경합니다. mp4포멧으로 키프레임 1로 변환합니다.

### 4. Split and Speeding Videos
영상을 기준에 맞게 자르고, 속도를 조정합니다.

### 5. Merge All Part to One Video
잘려진 영상을 하나의 비디오로 병합합니다.

## Parameter