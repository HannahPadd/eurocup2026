import { Dialog, Transition } from "@headlessui/react";
import { Fragment, PropsWithChildren } from "react";

type OkModalProps = {
  title: string;
  okText?: string;
  onClose: () => void;
  onOk: () => void;
  open: boolean;
};

export default function OkModal({
  title,
  okText = "OK",
  onClose,
  onOk,
  open,
  children,
}: PropsWithChildren<OkModalProps>) {
  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 z-[9999] overflow-y-auto"
        onClose={onClose}
      >
        <div className="min-h-screen px-4 text-center bg-white bg-opacity-30">
          <Dialog.Overlay className="fixed inset-0 backdrop-blur-lg bg-gray-500 bg-opacity-60" />
          <span
            className="inline-block h-screen align-middle"
            aria-hidden="true"
          >
            &#8203;
          </span>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white">
              {title.length > 0 && (
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900"
                >
                  {title}
                </Dialog.Title>
              )}
              <div className="mt-2">
                <div className="text-sm text-gray-500">{children}</div>
              </div>
              <div className="mt-4 flex flex-row-reverse">
                <button
                  type="button"
                  className="bg-middle text-white px-3 py-2 rounded-lg"
                  onClick={onOk}
                >
                  {okText}
                </button>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
