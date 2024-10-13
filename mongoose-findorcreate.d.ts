declare module 'mongoose-findorcreate' {
    function findOrCreate(
      condition: any,
      callback: (err: any, result: any) => void
    ): void;
  
    export = findOrCreate;
  }
  