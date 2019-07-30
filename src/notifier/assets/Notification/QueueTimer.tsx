import * as React from "react";

interface Props {
  queueStart: string;
}

interface State {
  elapsed: number;
}

export default class QueueTimer extends React.Component<Props, State> {
  public state = {
    elapsed: 0
  };

  public componentDidMount() {
    setInterval(() => {
      this.setState({
        elapsed: Date.now() - Date.parse(this.props.queueStart)
      });
    }, 1000);
  }

  public render() {
    return <span className="queue-timer">{this.getTimeStr()}</span>;
  }

  private getTimeStr() {
    let seconds = this.state.elapsed / 1000;

    const isNegative = seconds < 0;
    if (isNegative) { seconds = seconds * -1; }

    const padNumber = (num: string | number) => {
      if (num < 10) { return "0" + num; }
      return num;
    };

    const h = padNumber(Math.floor(seconds / 3600));
    const m = padNumber(Math.floor((seconds % 3600) / 60));
    const s = padNumber(Math.floor((seconds % 3600) % 60));

    let str = h + ":" + m + ":" + s;
    if (isNegative) { str = "- " + str; }

    return str;
  }
}
