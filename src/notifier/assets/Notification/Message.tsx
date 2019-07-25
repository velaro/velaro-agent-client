import * as React from "react";

interface Props {
  message: string;
}

export default function Message(props: Props) {
  return <div className="message">{props.message}</div>;
}
