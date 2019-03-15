import { ResettableTimeout, wait } from "../src/timer";
import { Deferred, DeferredState } from "../src/synchronization";
import { expect } from "chai";
import { fake, stub, assert } from "sinon";

describe("Deferred", () => {
	it("should support resolve", async () => {
		const d = new Deferred<number>();
		const thenFake = fake();
		d.promise.then(thenFake);
		const catchFake = fake();
		d.promise.catch(catchFake);

		assert.notCalled(thenFake);
		assert.notCalled(catchFake);
		expect(d.state).equal("none");

		d.resolve(42);
		await wait(0);

		assert.calledWithExactly(thenFake, 42);
		assert.notCalled(catchFake);
		expect(d.state).equal("resolved" as DeferredState);
	});

	it("should support reject", async () => {
		const d = new Deferred<number>();
		const thenFake = fake();
		d.promise.then(thenFake);
		const catchFake = fake();
		d.promise.catch(catchFake);

		d.reject(43);
		await wait(0);

		assert.notCalled(thenFake);
		assert.calledWithExactly(catchFake, 43);
		expect(d.state).equal("rejected" as DeferredState);
	});
});

describe("timer", () => {
	it("should work", async () => {
		let timedOut = false;
		const t = new ResettableTimeout(100);
		t.onTimeout.then(() => {
			timedOut = true;
		});
		expect(t.timedOut).false;
		expect(timedOut).false;

		await wait(95);
		expect(t.timedOut).false;
		expect(timedOut).false;

		t.reset();
		expect(t.timedOut).false;
		expect(timedOut).false;

		await wait(95);
		expect(t.timedOut).false;
		expect(timedOut).false;

		t.reset(90);
		expect(t.timedOut).false;
		expect(timedOut).false;

		await wait(95);
		expect(t.timedOut).true;
		expect(timedOut).true;
	});
});
