import csv
from tqdm import tqdm
import os

profilesPath = "F:/Save/LocalProfiles/"

tplEditable = """[Editable]
BirthYear=0
CharacterID=default
DisplayName={{Player}}
IgnoreStepCountCalories=0
IsMale=1
LastUsedHighScoreName=
Voomax=0.000000
WeightPounds=0"""

tplStats = """<?xml version="1.0" encoding="UTF-8" ?>

<Stats>
<GeneralData>
<DisplayName>{{Player}}</DisplayName>
<CharacterID>default</CharacterID>
<LastUsedHighScoreName></LastUsedHighScoreName>
<WeightPounds>0</WeightPounds>
<Voomax>0.000000</Voomax>
<BirthYear>0</BirthYear>
<IgnoreStepCountCalories>0</IgnoreStepCountCalories>
<IsMale>1</IsMale>
<IsMachine>0</IsMachine>
<Guid>3889fe0cce4d3812</Guid>
<SortOrder></SortOrder>
<LastDifficulty></LastDifficulty>
<LastCourseDifficulty></LastCourseDifficulty>
<Song Dir=''/>
<Course/>
<CurrentCombo>0</CurrentCombo>
<TotalSessions>0</TotalSessions>
<TotalSessionSeconds>0</TotalSessionSeconds>
<TotalGameplaySeconds>0</TotalGameplaySeconds>
<TotalCaloriesBurned>0.000000</TotalCaloriesBurned>
<GoalType>0</GoalType>
<GoalCalories>0</GoalCalories>
<GoalSeconds>0</GoalSeconds>
<LastPlayedMachineGuid>f46428ed29f08962</LastPlayedMachineGuid>
<LastPlayedDate>2026-05-27</LastPlayedDate>
<TotalDancePoints>0</TotalDancePoints>
<NumExtraStagesPassed>0</NumExtraStagesPassed>
<NumExtraStagesFailed>0</NumExtraStagesFailed>
<NumToasties>0</NumToasties>
<TotalTapsAndHolds>0</TotalTapsAndHolds>
<TotalJumps>0</TotalJumps>
<TotalHolds>0</TotalHolds>
<TotalRolls>0</TotalRolls>
<TotalMines>0</TotalMines>
<TotalHands>0</TotalHands>
<TotalLifts>0</TotalLifts>
<DefaultModifiers/>
<Unlocks/>
<NumSongsPlayedByPlayMode/>
<NumSongsPlayedByStyle/>
<NumSongsPlayedByDifficulty/>
<NumSongsPlayedByMeter/>
<NumTotalSongsPlayed>0</NumTotalSongsPlayed>
<NumStagesPassedByPlayMode/>
<NumStagesPassedByGrade/>
</GeneralData>
<SongScores/>
<CourseScores/>
<CategoryScores/>
<ScreenshotData/>
<CalorieData/>
</Stats>"""

with open('players.csv', newline='') as csvfile:
    reader = csv.reader(csvfile, delimiter=',', quotechar='"')
    rows = list(reader)
    header = rows[0]

    for row in tqdm(rows[1:]):
        player = {}
        for i,h in enumerate(header):
            player[h] = row[i]

        profileFolder = profilesPath + player["playerName"] + "/"
        if os.path.exists(profileFolder):
            continue
        os.mkdir(profileFolder)

        with open(profileFolder + "Editable.ini", "w") as f:
            f.write(tplEditable.replace("{{Player}}", player["playerName"]))
        with open(profileFolder + "Stats.xml", "w") as f:
            f.write(tplStats.replace("{{Player}}", player["playerName"]))