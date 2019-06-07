import { ResettableTimeout, wait } from "../src/timer";
import { Deferred, DeferredState } from "../src/synchronization";
import { expect } from "chai";
import { fake, stub, assert } from "sinon";
import { dispose, Disposable, disposeOnReturn } from "../src/disposable";

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

describe("disposable", () => {
	it("Disposable.create and dispose should work", () => {
		function returnsVoid(): void {}

		expect(Disposable.create()).to.equal(Disposable.empty);
		expect(Disposable.create(returnsVoid())).to.equal(Disposable.empty);
		expect(Disposable.create([])).to.equal(Disposable.empty);

		dispose(Disposable.empty); // nothing happens

		const disposeFake = fake();
		dispose(Disposable.create(disposeFake));
		assert.calledOnce(disposeFake);
	});

	it("Disposable.fn", () => {
		const dispose1Fake = fake();
		const dispose2Fake = fake();
		const dispose3Fake = fake();
		const dispose4Fake = fake();

		const d = Disposable.fn(track => {
			track(Disposable.create(dispose1Fake));
			track(Disposable.empty);
			track(Disposable.create(dispose2Fake));

			track([
				Disposable.create(dispose3Fake),
				{ dispose: () => dispose4Fake() },
			]);
		});

		assert.notCalled(dispose1Fake);
		assert.notCalled(dispose2Fake);
		assert.notCalled(dispose3Fake);
		assert.notCalled(dispose4Fake);

		dispose(d);

		assert.calledOnce(dispose1Fake);
		assert.calledOnce(dispose2Fake);
		assert.calledOnce(dispose3Fake);
		assert.calledOnce(dispose4Fake);
	});

	it("Disposable.fn 2", () => {
		const dispose1Fake = fake();
		const dispose2Fake = fake();
		const dispose3Fake = fake();
		const dispose4Fake = fake();

		const d = Disposable.fn();

		const d1 = Disposable.create(dispose1Fake);
		d.track(d1);
		d.track(Disposable.empty);
		d.track(Disposable.create(dispose2Fake));
		d.track([
			Disposable.create(dispose3Fake),
			{ dispose: () => dispose4Fake() },
		]);
		d.untrack(d1);

		assert.notCalled(dispose1Fake);
		assert.notCalled(dispose2Fake);
		assert.notCalled(dispose3Fake);
		assert.notCalled(dispose4Fake);

		dispose(d);

		assert.notCalled(dispose1Fake);
		assert.calledOnce(dispose2Fake);
		assert.calledOnce(dispose3Fake);
		assert.calledOnce(dispose4Fake);
	});

	it("disposeOnReturn sync", () => {
		const dispose1Fake = fake();
		const dispose2Fake = fake();
		const dispose3Fake = fake();
		const dispose4Fake = fake();

		//disposeOnReturn(track => );
	});
});
