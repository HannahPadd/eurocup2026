import { Body, Controller, Delete, Get, Param, Patch, Post, ValidationPipe } from '@nestjs/common';
import { StreamViewService } from '../services';
import { Player } from '@persistence/entities';
import { StreamView } from '../view/stream.view';


@Controller('streamview')
export class StreamViewController {
    constructor(private readonly service: StreamViewService) { }

    @Get()
    async findall(): Promise<StreamView[]> {
        const players = this.service.findAllPlayers();
        const brackets = this.service.findAllBrackets();
        let streamViewList = [];
        //TODO: Add all fields to player profile
        (await players).forEach((player: Player) => {
            const streamView = new StreamView()

            streamView.playerPictureUrl = player.playerPictureUrl;
            streamView.playerName = player.playerName// === null ? player.name : "Player name not found (this is a bug and should be fixed)";;
            streamView.playedFor = player.playedFor;
            streamView. country = player.country;
            streamView.highestStaminaPass = player.highestStaminaPass;
            streamView.staminaLevel = player.statminaLevel;
            streamView.footSpeedLevel = player.footSpeedLevel;
            streamView.crossOverTechLevel = player.crossOverTechLevel;
            streamView.sideSwitchTechLevel = player.sideSwitchTechLevel;
            streamView.bracketTechLevel = player.bracketTechLevel;
            streamView.doubleStepTechLevel = player.doubleStepTechLevel;
            streamView.jackTechLevel = player.jackTechLevel;
            streamView.xmodTechLevel = player.xmodTechLevel;
            streamView.burstTechLevel = player.burstTechLevel;
            streamView.rhythmsTechLevel = player.rhythmsTechLevel;

            streamViewList.push(streamView);
        });
        console.log(streamViewList);
        return streamViewList;
    }

     @Get(':id')
    async findOne(@Param('id') id: number): Promise<StreamView | null> {
        const player = await this.service.findOnePlayer(id);
        //const brackets = this.service.findAllBrackets();

        //TODO: Add all fields to player profile
            const streamView = new StreamView()

        streamView.playerPictureUrl = player.playerPictureUrl;
        streamView.playerName = player.playerName// === null ? player.name : "Player name not found (this is a bug and should be fixed)";;
        streamView.playedFor = player.playedFor;
        streamView. country = player.country;
        streamView.highestStaminaPass = player.highestStaminaPass;
        streamView.staminaLevel = player.statminaLevel;
        streamView.footSpeedLevel = player.footSpeedLevel;
        streamView.crossOverTechLevel = player.crossOverTechLevel;
        streamView.sideSwitchTechLevel = player.sideSwitchTechLevel;
        streamView.bracketTechLevel = player.bracketTechLevel;
        streamView.doubleStepTechLevel = player.doubleStepTechLevel;
        streamView.jackTechLevel = player.jackTechLevel;
        streamView.xmodTechLevel = player.xmodTechLevel;
        streamView.burstTechLevel = player.burstTechLevel;
        streamView.rhythmsTechLevel = player.rhythmsTechLevel;

        return streamView;

    }
    
    //Get Player
    //@Get('player/id')
    //findOne() {
        //
        //}
}