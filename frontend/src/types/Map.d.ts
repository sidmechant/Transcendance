import { Euler, Group } from 'three';
import { MapObject } from '../models/MapObject';
import { Position } from '../store/Player';
import { SkillInfoProps } from '../types/physics';
import { World } from '../store/physic/World';

export type GLTFResult = GLTF & {
    nodes: {
        //Balls
        Cactus: THREE.Mesh
        Cactus_Fleur: THREE.Mesh

        Shuriken: THREE.Mesh
        Shuriken_Lame01: THREE.Mesh
        Shuriken_Lame02: THREE.Mesh
        Shuriken_Lame03: THREE.Mesh
        Shuriken_Lame04: THREE.Mesh

        Balle: THREE.Mesh
        Balle_Pique: THREE.Mesh

        //Paddles

        Eventail: THREE.Mesh

        Belier: THREE.Mesh
        Belier_Roue: THREE.Mesh
        Belier_Roue02: THREE.Mesh
        Belier_Belier: THREE.Mesh
        Belier_Tronc_Top: THREE.Mesh
        Belier_Chaine: THREE.Mesh
        Belier_Chaine01: THREE.Mesh

        Handcar: THREE.Mesh
        Handcar_Roue: THREE.Mesh
        Handcar_Roue02: THREE.Mesh
        Handcar_Tige: THREE.Mesh
        Handcar_Rouage: THREE.Mesh
        Handcar_Baton: THREE.Mesh
    }
    materials: {
        Material__25: THREE.MeshStandardMaterial
    }
}


export interface MapProps {
	isInIntro?: boolean;
    visible?: boolean;
    colors?: string[];
    location?: -1 | 1;
    skillInfo?: SkillInfoProps;
	isMe?: boolean;
}

export interface PaddleProps {
    animation?: boolean,
    effect?: string,
    position?: Position,
    velocity?: Position,
    location?: -1 | 1,
    skillInfo?: SkillInfoProps,
    collision?: number
}


export interface BallProps {
    animation?: boolean,
    effect?: string,
    position?: Position,
	rotation?: [number, number, number],
    velocity?: Position,
    collision?: number
}

export type modeType =
    'MatchMaking' |
    'IA' |
    '2PLocal' |
    '2POnline' |
    undefined;

export type requestType =
    'uncomplete' |
    'complete';

export type mapName =
    'Cactus Canyon' |
    'Temple of the Silent Kunoichi' |
    'Chivalry\'s Last Stand' |
    'Pixel Purgatory';

export type MapInfo = {
    id: MapTheme,
    mapName: mapName,
    previewImagePath: string,
    font: string,
    mainColor: string,
    secondaryColor: string,
    mapJSX: (props: PropsMap) => JSX.Element,
    paddleJSX: (props: PaddleProps) => JSX.Element,
    ballJSX: (props: BallProps) => JSX.Element
};

export type MapsAssets = {
    [key in MapTheme]: MapObject;
};

