import { ipcRenderer } from "electron";
import { Component } from "react";
import { render } from "react-dom";

const Icon = (props: undefined) => {
  return createElement("div", { className: "icon" });
};

const Message = ({ message }) => {
  return createElement("div", { className: "message" }, message);
};

const QueueTimer = createClass({
  getInitialState() {
    return {
      elapsed: 0
    };
  },

  componentDidMount() {
    setInterval(() => {
      this.setState({
        elapsed: Date.now() - Date.parse(this.props.queueStart)
      });
    }, 1000);
  },

  getTimeStr() {
    let seconds = this.state.elapsed / 1000;

    var isNegative = seconds < 0;
    if (isNegative) seconds = seconds * -1;

    var padNumber = function(num: string | number) {
      if (num < 10) return "0" + num;
      return num;
    };

    var h = padNumber(Math.floor(seconds / 3600));
    var m = padNumber(Math.floor((seconds % 3600) / 60));
    var s = padNumber(Math.floor((seconds % 3600) % 60));

    var str = h + ":" + m + ":" + s;
    if (isNegative) str = "- " + str;

    return str;
  },

  render() {
    return createElement(
      "div",
      { className: "queue-timer" },
      this.getTimeStr()
    );
  }
});

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

  return createElement("button", { className: "button", onClick }, label);
};

const AcceptButton = (props: { id: any; engagementId: any; }) => {
  return createButton("Accept", "acceptEngagement", props);
};

const RejectButton = (props: { id: any; engagementId: any; }) => {
  return createButton("Reject", "rejectEngagement", props);
};

const IgnoreButton = (props: { id: any; engagementId: any; }) => {
  return createButton("Ignore", "ignoreEngagement", props);
};

const DismissButton = (props: { id: any; engagementId: any; }) => {
  return createButton("Dismiss", "dismissNotification", props);
};

const ViewButton = (props: { id: any; engagementId: any; }) => {
  return createButton("View", "viewEngagement", props);
};

const InfoButton = (props: { id: any; engagementId: any; }) => {
  const removesNotification = false;
  return createButton("Info", "viewInfo", props, removesNotification);
};

const Buttons = (props: { id?: any; engagementId?: any; queueIncomingRequests: any; isNewLineNotification: any; rejectEnabled?: any; }) => {
  const { queueIncomingRequests, isNewLineNotification, rejectEnabled } = props;

  if (isNewLineNotification) {
    return createElement(
      "div",
      { className: "buttons" },

      DismissButton(props)
    );
  }

  return createElement(
    "div",
    { className: "buttons" },
    // hide the accept button for auto-routed chats
    queueIncomingRequests && AcceptButton(props),

    // hide the reject button for auto-routed chats
    rejectEnabled && queueIncomingRequests && RejectButton(props),

    // always display the ignore button
    IgnoreButton(props),

    // hide the view button for queued chats
    !queueIncomingRequests && ViewButton(props),

    // always display the info button
    InfoButton(props)
  );
};

const Notification = createClass({
  render() {
    const {
      id,
      message,
      engagementId,
      queueStart,
      queueIncomingRequests,
      isNewLineNotification
    } = this.props.notification;

    return createElement(
      "div",
      { className: "notification" },
      createElement("div", { className: "left-col" }, Icon()),
      createElement(
        "div",
        { className: "right-col" },
        Message({ message }),
        queueIncomingRequests && createElement(QueueTimer, { queueStart }),
        Buttons({
          id,
          engagementId,
          queueIncomingRequests,
          isNewLineNotification
        })
      )
    );
  }
});

ipcRenderer.on("notification-props", (event: any, props: any) => {
  const rootElement = createElement(Notification, props);
  render(rootElement, document.getElementById("app"));
});
