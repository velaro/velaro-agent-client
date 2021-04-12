import { ipcRenderer } from "electron";
import * as React from "react";
import { render } from "react-dom";
import Icon from "./Notification/Icon";
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
  rejectEnabled: boolean;
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
  const { rejectEnabled, queueIncomingRequests, isNewLineNotification } = props;

  // newline notification just has dismiss button
  if (isNewLineNotification) {
    return <div className="buttons">{DismissButton(props)}</div>;
  }

  return (
    <div className="buttons">
      {
        // show the accept button for queued chats
        queueIncomingRequests && AcceptButton(props)
      }

      {
        // show the reject button for queued chats
        rejectEnabled && queueIncomingRequests && RejectButton(props)
      }

      {
        // always display the ignore button
        IgnoreButton(props)
      }

      {
        // show the view button for auto-routed chats
        !queueIncomingRequests && ViewButton(props)
      }

      {
        // always display the info button
        InfoButton(props)
      }
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
    rejectEnabled: boolean;
  };
}

function Notification(props: NotificationProps) {
  const {
    id,
    message,
    engagementId,
    queueStart,
    queueIncomingRequests,
    isNewLineNotification,
    rejectEnabled,
  } = props.notification;

  React.useEffect(() => {
    ipcRenderer.send("renderComplete", {
      notificationId: id,
      scrollHeight: document.body.scrollHeight,
    });
  }, []);

  return (
    <div className="notification">
      <div className="row">
        <div className="col">
          <Icon />
        </div>
        <div className="col" style={{ width: "100%" }}>
          <div className="message">
            <div>{message}</div>
            {queueIncomingRequests && (
              <div>
                <QueueTimer queueStart={queueStart} />
              </div>
            )}
          </div>
        </div>
      </div>
      <Buttons
        id={id}
        engagementId={engagementId}
        queueIncomingRequests={queueIncomingRequests}
        isNewLineNotification={isNewLineNotification}
        rejectEnabled={rejectEnabled}
      />
    </div>
  );
}

ipcRenderer.on("notification-props", (event: any, props: any) => {
  const rootElement = <Notification {...props} />;
  render(rootElement, document.getElementById("app"));
});
