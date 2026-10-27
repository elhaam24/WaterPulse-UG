declare module 'africastalking' {
  export interface AfricasTalkingOptions {
    apiKey: string;
    username: string;
  }

  export interface SendSmsOptions {
    to: string | string[];
    message: string;
    from?: string;
    enqueue?: boolean;
  }

  export interface AfricasTalkingSMS {
    send(options: SendSmsOptions): Promise<any>;
    fetchMessages(options?: any): Promise<any>;
  }

  export interface AfricasTalkingInstance {
    SMS: AfricasTalkingSMS;
    [key: string]: any;
  }

  export default function AfricasTalking(options: AfricasTalkingOptions): AfricasTalkingInstance;
}
