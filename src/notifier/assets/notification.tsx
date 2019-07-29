import { ipcRenderer } from "electron";
import * as React from "react";
import { render } from "react-dom";
import Icon from "./Notification/Icon";
import Message from "./Notification/Message";
import QueueTimer from "./Notification/QueueTimer";

const createButton = (
  label: string,
  eventName: string,
  { id, engagementId }: any,
  removesNotification = true
) => {
  const onClick = () => {
    ipcRenderer.send(eventName, { engagementId });

    if (removesNotification) {
      ipcRenderer.send("removeNotification", { id });
    }
  };

  return (
    <button className="button" onClick={onClick}>
      {label}
    </button>
  );
};

interface ButtonProps {
  id?: any;
  engagementId?: any;
  queueIncomingRequests: any;
  isNewLineNotification: any;
  rejectEnabled?: any;
}

const AcceptButton = (props: ButtonProps) => {
  return createButton("Accept", "acceptEngagement", props);
};

const RejectButton = (props: ButtonProps) => {
  return createButton("Reject", "rejectEngagement", props);
};

const IgnoreButton = (props: ButtonProps) => {
  return createButton("Ignore", "ignoreEngagement", props);
};

const DismissButton = (props: ButtonProps) => {
  return createButton("Dismiss", "dismissNotification", props);
};

const ViewButton = (props: ButtonProps) => {
  return createButton("View", "viewEngagement", props);
};

const InfoButton = (props: ButtonProps) => {
  const removesNotification = false;
  return createButton("Info", "viewInfo", props, removesNotification);
};

const Buttons = (props: ButtonProps) => {
  const { queueIncomingRequests, isNewLineNotification, rejectEnabled } = props;

  if (isNewLineNotification) {
    return <div className="buttons">{DismissButton(props)}</div>;
  }

  return (
    <div className="buttons">
      {// hide the accept button for auto-routed chats
      queueIncomingRequests && AcceptButton(props)}

      {// hide the reject button for auto-routed chats
      rejectEnabled && queueIncomingRequests && RejectButton(props)}

      {// always display the ignore button
      IgnoreButton(props)}

      {// hide the view button for queued chats
      !queueIncomingRequests && ViewButton(props)}

      {// always display the info button
      InfoButton(props)}
    </div>
  );
};

interface NotificationProps {
  notification: {
    id: any;
    message: string;
    engagementId: string;
    queueStart: any;
    queueIncomingRequests: any;
    isNewLineNotification: boolean;
  };
}

function Notification(props: NotificationProps) {
  const {
    id,
    message,
    engagementId,
    queueStart,
    queueIncomingRequests,
    isNewLineNotification
  } = props.notification;

  return (
    <div className="notification">
      <Icon />
      <Message message={message} />
      {queueIncomingRequests && <QueueTimer queueStart={queueStart} />}
      <Buttons
        id={id}
        engagementId={engagementId}
        queueIncomingRequests={queueIncomingRequests}
        isNewLineNotification={isNewLineNotification}
      />
    </div>
  );
}

ipcRenderer.on("notification-props", (event: any, props: any) => {
  const rootElement = <Notification {...props} />;
  render(rootElement, document.getElementById("app"));
});
