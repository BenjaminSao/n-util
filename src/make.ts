import { given } from "@nivinjoseph/n-defensive";

// public
export abstract class Make // static class
{
    private constructor() { }

    /**
     * 
     * Returns the function results of `func` if the call is successful or if `errorPredicate` is false, else it'll retry, `numberOfRetries` times.
     * 
     * @param func - The callback function being invoked.
     * @param numberOfRetries - The amount of time to invoke `func`.
     * @param errorPredicate - A callback function that when an error occurs, then a value `error` will be passed in which is the error caught.
     */
    public static retry<T>(func: (...params: any[]) => Promise<T>, numberOfRetries: number, errorPredicate?: (error: any) => boolean): (...params: any[]) => Promise<T>
    {
        given(func, "func").ensureHasValue().ensureIsFunction();
        given(numberOfRetries, "numberOfRetries").ensureHasValue().ensureIsNumber().ensure(t => t > 0);
        given(errorPredicate, "errorPredicate").ensureIsFunction();
        
        let numberOfAttempts = numberOfRetries + 1;
        
        let result = async function (...p: any[]): Promise<T>
        {
            let successful = false;
            let attempts = 0;

            let funcResult: any;
            let error: any;

            while (successful === false && attempts < numberOfAttempts)
            {
                attempts++;

                try 
                {
                    funcResult = await func(...p);
                    successful = true;
                }
                catch (err)
                {
                    error = err;
                    if (errorPredicate && !errorPredicate(error))
                        break;
                }
            }

            if (successful)
                return funcResult;

            throw error;
        };

        return result;
    }

    /**
     * 
     * Returns the function results of `func` if the call is successful or if `errorPredicate` is false, else it'll retry with a delay given by `delayMS`, with `numberOfRetries` times.
     * 
     * @param func - The callback function being invoked.
     * @param numberOfRetries - The amount of time to invoke `func`.
     * @param delayMS - A delay before the next function call. Value is in milliseconds
     * @param errorPredicate - A callback function that when an error occurs, then a value `error` will be passed in which is the error caught.
     */
    public static retryWithDelay<T>(func: (...params: any[]) => Promise<T>, numberOfRetries: number, delayMS: number, errorPredicate?: (error: any) => boolean): (...params: any[]) => Promise<T>
    {
        given(func, "func").ensureHasValue().ensureIsFunction();
        given(numberOfRetries, "numberOfRetries").ensureHasValue().ensureIsNumber().ensure(t => t > 0);
        given(errorPredicate, "errorPredicate").ensureIsFunction();
        
        let numberOfAttempts = numberOfRetries + 1;
        
        let result = async function (...p: any[]): Promise<T>
        {
            let successful = false;
            let attempts = 0;

            let funcResult: any;
            let error: any;

            let executeWithDelay = (delay: number) =>
            {
                return new Promise((resolve, reject) =>
                {
                    setTimeout(() =>
                    {
                        func(...p)
                            .then(t => resolve(t))
                            .catch(err => reject(err));
                    }, delay);
                });

            };

            while (successful === false && attempts < numberOfAttempts)
            {
                attempts++;

                try 
                {
                    funcResult = await executeWithDelay(attempts === 1 ? 0 : delayMS);
                    successful = true;
                }
                catch (err)
                {
                    error = err;
                    if (errorPredicate && !errorPredicate(error))
                        break;
                }
            }

            if (successful)
                return funcResult;

            throw error;
        };

        return result;
    }

    /**
     * 
     * Returns the function results of `func` if the call is successful or if `errorPredicate` is false, else it'll retry with a delay that increases exponentially between each function call, with `numberOfRetries` times.
     * 
     * @param func - The callback function being invoked.
     * @param numberOfRetries - The amount of time to invoke `func`.
     * @param delayMS - A delay before the next function call. Value is in milliseconds
     * @param errorPredicate - A callback function that when an error occurs, then a value `error` will be passed in which is the error caught.
     */
    public static retryWithExponentialBackoff<T>(func: (...params: any[]) => Promise<T>, numberOfRetries: number, errorPredicate?: (error: any) => boolean): (...params: any[]) => Promise<T>
    {
        given(func, "func").ensureHasValue().ensureIsFunction();
        given(numberOfRetries, "numberOfRetries").ensureHasValue().ensureIsNumber().ensure(t => t > 0);
        given(errorPredicate, "errorPredicate").ensureIsFunction();
        
        let numberOfAttempts = numberOfRetries + 1;
        
        let result = async function (...p: any[]): Promise<T>
        {
            let successful = false;
            let attempts = 0;
            let delayMS = 0;

            let funcResult: any;
            let error: any;

            let executeWithDelay = (delay: number) =>
            {
                return new Promise((resolve, reject) =>
                {
                    setTimeout(() =>
                    {
                        func(...p)
                            .then(t => resolve(t))
                            .catch(err => reject(err));
                    }, delay);
                });

            };

            while (successful === false && attempts < numberOfAttempts)
            {
                attempts++;

                try 
                {
                    funcResult = await executeWithDelay(delayMS);
                    successful = true;
                }
                catch (err)
                {
                    error = err;
                    if (errorPredicate && !errorPredicate(error))
                        break;
                    // delayMS = (delayMS + Make.getRandomInt(200, 500)) * attempts;
                    delayMS = delayMS + (Make.randomInt(400, 700) * attempts);
                    // delayMS = 1000 * attempts;
                }
            }

            if (successful)
                return funcResult;

            throw error;
        };

        return result;
    }
    
    /**
     * 
     * Returns an asynchronous function given a synchronous callback, `func`.
     * 
     * @param func - The callback function being converted to an asynchronous function.
     */
    public static syncToAsync<T>(func: (...params: any[]) => T): (...params: any[]) => Promise<T>
    {
        given(func, "func").ensureHasValue().ensureIsFunction();
        
        let result = function (...p: any[]): Promise<T>
        {
            try 
            {
                let val = func(...p);
                return Promise.resolve(val);
            }
            catch (error)
            {
                return Promise.reject(error);
            }
        };
        
        return result;
    }
    
    /**
     * 
     * Returns a promise given a callback `func`.
     * 
     * @param func - The callback function being converted to a promise.
     */
    public static callbackToPromise<T>(func: (...params: any[]) => void): (...params: any[]) => Promise<T>
    {
        given(func, "func").ensureHasValue().ensureIsFunction();
        
        let result = function (...p: any[]): Promise<T>
        {
            let promise = new Promise<any>((resolve, reject) =>
                func(...p, (err: Error, ...values: any[]) =>
                    err
                        ? reject(err)
                        : values.length === 0
                            ? resolve(undefined)
                            : values.length === 1
                                ? resolve(values[0])
                                : resolve(values)));
            
            return promise;
        };   
        
        return result;
    }
    
    /**
     * 
     * Iterates through a loop specified by the `numberOfTimes` while invoking the callback function `func` with the specific index of the loop.
     * 
     * @param func - The callback function being invoked throughout the loop.
     * @param numberOfTimes - The amount of times 
     */
    public static loop(func: (index: number) => void, numberOfTimes: number): void
    {
        given(func, "func").ensureHasValue().ensureIsFunction();
        given(numberOfTimes, "numberOfTimes").ensureHasValue().ensureIsNumber().ensure(t => t > 0);
        
        for (let i = 0; i < numberOfTimes; i++)
            func(i);  
    }
    
    /**
     * 
     * Iterates through a loop specified by the `numberOfTimes` while invoking the asynchronous callback function `func` with the specific index of the loop. 
     * The `degreeOfParallelism` can be specified to determine the amount of parallelism wanted.
     * 
     * @param func - The callback function being invoked throughout the loop.
     * @param numberOfTimes - The amount of times.
     * @param degreesOfParallelism - The amount of parallelism wanted. Defaults to all.
     */
    public static async loopAsync(asyncFunc: (index: number) => Promise<void>, numberOfTimes: number, degreesOfParallelism?: number): Promise<void>
    {
        given(asyncFunc, "asyncFunc").ensureHasValue().ensureIsFunction();
        given(numberOfTimes, "numberOfTimes").ensureHasValue().ensureIsNumber().ensure(t => t > 0);
        
        let taskManager = new TaskManager<void>(numberOfTimes, asyncFunc, degreesOfParallelism, false);
        await taskManager.execute();
    }
    
    public static errorSuppressed<T extends (...params: any[]) => U, U>(func: T, defaultValue: U = null): T
    {
        given(func, "func").ensureHasValue().ensureIsFunction();
        
        const result = function (...p: any[]): any
        {
            try 
            {
                return func(...p);
            }
            catch (e)
            {
                console.error(e);
                return defaultValue;
            }
        };
        
        return <any>result;
    }
    
    public static errorSuppressedAsync<T extends (...params: any[]) => Promise<U>, U>(asyncFunc: T, defaultValue: U = null): T
    {
        given(asyncFunc, "asyncFunc").ensureHasValue().ensureIsFunction();

        const result = async function (...p: any[]): Promise<any>
        {
            try 
            {
                return await asyncFunc(...p);
            }
            catch (e)
            {
                console.error(e);
                return defaultValue;
            }
        };

        return <any>result;
    }

    /**
     * 
     * Returns a random int given `min` value which is inclusive and `max` value which is exclusive.
     * 
     * @param min - The minimum inclusive value.
     * @param max - The maximum exclusive value.
     */
    public static randomInt(min: number, max: number): number
    {
        given(min, "min").ensureHasValue().ensureIsNumber();
        given(max, "max").ensureHasValue().ensureIsNumber()
            .ensure(t => t > min, "value has to be greater than min");
        
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min)) + min; // The maximum is exclusive and the minimum is inclusive
    }
    
    /**
     * 
     * Returns a generated random alphanumeric code of length `numChars`.
     * 
     * @param numChars - The length of the random code.
     */
    public static randomCode(numChars: number): string
    {
        given(numChars, "numChars").ensureHasValue().ensureIsNumber()
            .ensure(t => t > 0, "value has to be greater than 0");
        
        // let allowedChars = "0123456789-abcdefghijklmnopqrstuvwxyz_ABCDEFGHIJKLMNOPQRSTUVWXYZ~".split("");
        let allowedChars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
        
        const shuffleTimes = Make.randomInt(1, 10);
        const shuffleAmount = Make.randomInt(7, 17);
        Make.loop(() => allowedChars = [...allowedChars.skip(shuffleAmount), ...allowedChars.take(shuffleAmount)],
            shuffleTimes);
        
        if ((Date.now() % 2) === 0)
            allowedChars = allowedChars.reverse();
        
        const result: string[] = [];
        
        Make.loop(() =>
        {
            const random = Make.randomInt(0, allowedChars.length);
            result.push(allowedChars[random]);
        }, numChars);
        
        return result.join("");
    }
    
    /**
     * 
     * Returns a generated random alphabetical code of length `numChars`. If `caseInsensitive` is true then the code will only consist of lowercase letters.
     * 
     * @param numChars - The length of the random code.
     * @param caseInsensitive - If true the code will only consist of lowercase letters, else both uppercase and lowercase.
     */
    public static randomTextCode(numChars: number, caseInsensitive: boolean = false): string
    {
        given(numChars, "numChars").ensureHasValue().ensureIsNumber()
            .ensure(t => t > 0, "value has to be greater than 0");
        
        given(caseInsensitive, "caseInsensitive").ensureHasValue().ensureIsBoolean();

        let allowedChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
        if (caseInsensitive)
            allowedChars = "abcdefghijklmnopqrstuvwxyz".split("");
        
        const shuffleTimes = Make.randomInt(1, 10);
        const shuffleAmount = Make.randomInt(7, 11);
        Make.loop(() => allowedChars = [...allowedChars.skip(shuffleAmount), ...allowedChars.take(shuffleAmount)],
            shuffleTimes);
        
        if ((Date.now() % 2) === 0)
            allowedChars = allowedChars.reverse();

        const result: string[] = [];

        Make.loop(() =>
        {
            const random = Make.randomInt(0, allowedChars.length);
            result.push(allowedChars[random]);
        }, numChars);

        return result.join("");
    }
    
    /**
     * 
     * Returns a generated random numerical code of length `numChars`.
     * 
     * @param numChars - The length of the random code.
     */
    public static randomNumericCode(numChars: number): string
    {
        given(numChars, "numChars").ensureHasValue().ensureIsNumber()
            .ensure(t => t > 0, "value has to be greater than 0");

        let allowedChars = "0123456789".split("");

        const shuffleTimes = Make.randomInt(1, 10);
        const shuffleAmount = Make.randomInt(3, 7);
        Make.loop(() => allowedChars = [...allowedChars.skip(shuffleAmount), ...allowedChars.take(shuffleAmount)],
            shuffleTimes);

        if ((Date.now() % 2) === 0)
            allowedChars = allowedChars.reverse();

        const result: string[] = [];

        Make.loop(() =>
        {
            const random = Make.randomInt(0, allowedChars.length);
            result.push(allowedChars[random]);
        }, numChars);

        return result.join("");
    }
}


class TaskManager<T>
{
    private readonly _numberOfTimes: number;
    private readonly _taskFunc: (index: number) => Promise<any>;
    private readonly _taskCount: number;
    private readonly _captureResults: boolean;
    private readonly _tasks: Task<T>[];
    private readonly _results: any[];


    public constructor(numberOfTimes: number, taskFunc: (index: number) => Promise<any>, taskCount: number, captureResults: boolean)
    {
        this._numberOfTimes = numberOfTimes;
        this._taskFunc = taskFunc;
        this._taskCount = !taskCount || taskCount <= 0 ? numberOfTimes : taskCount;
        this._captureResults = captureResults;

        this._tasks = [];
        for (let i = 0; i < this._taskCount; i++)
            this._tasks.push(new Task<T>(this, i, this._taskFunc, captureResults));

        if (this._captureResults)
            this._results = [];
    }


    public async execute(): Promise<void>
    {
        for (let i = 0; i < this._numberOfTimes; i++)
        {
            if (this._captureResults)
                this._results.push(null);
            await this.executeTaskForItem(i);
        }

        await this.finish();
    }

    public addResult(itemIndex: number, result: any): void
    {
        this._results[itemIndex] = result;
    }

    public getResults(): any[]
    {
        return this._results;
    }


    private async executeTaskForItem(itemIndex: number): Promise<void>
    {
        let availableTask = this._tasks.find(t => t.isFree);
        if (!availableTask)
        {
            let task = await Promise.race(this._tasks.map(t => t.promise));
            task.free();
            availableTask = task;
        }

        availableTask.execute(itemIndex);
    }

    private finish(): Promise<any>
    {
        return Promise.all(this._tasks.filter(t => !t.isFree).map(t => t.promise));
    }
}

class Task<T>
{
    private readonly _manager: TaskManager<T>;
    // @ts-ignore
    private readonly _id: number;
    private readonly _taskFunc: (index: number) => Promise<any>;
    private readonly _captureResult: boolean;
    private _promise: Promise<Task<T>>;


    public get promise(): Promise<Task<T>> { return this._promise; }
    public get isFree(): boolean { return this._promise === null; }


    public constructor(manager: TaskManager<T>, id: number, taskFunc: (index: number) => Promise<any>, captureResult: boolean)
    {
        this._manager = manager;
        this._id = id;
        this._taskFunc = taskFunc;
        this._captureResult = captureResult;
        this._promise = null;
    }


    public execute(itemIndex: number): void
    {
        this._promise = new Promise((resolve, reject) =>
        {
            this._taskFunc(itemIndex)
                .then((result) =>
                {
                    if (this._captureResult)
                        this._manager.addResult(itemIndex, result);
                    resolve(this);
                })
                .catch((err) => reject(err));
        });
    }

    public free(): void
    {
        this._promise = null;
    }
}