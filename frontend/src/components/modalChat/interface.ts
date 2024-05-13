export interface User {
    id: number,
    pseudo: string,
    urlPhotoProfile: string,
}

export interface CreateChannelDto {
    name: string,
    type: string,
    password?: string,
}

export interface IEvent {
    target: string,
    type: string,
    content: string,
    room?: number,
    data?: any,
    userId?: number,
}