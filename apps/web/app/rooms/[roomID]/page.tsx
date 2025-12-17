import { RoomCanvas } from "@/components/RoomCanvas";

type Props = {
  params: Promise<{ roomID: string }>;
};

export default async function RoomPage({ params }: Props) {
  const { roomID } = await params;
  return (
    <RoomCanvas roomId={roomID} />
  )
}
