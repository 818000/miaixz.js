/*
 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
 ~                                                                           ~
 ~ Copyright (c) 2015-2026 miaixz.org and other contributors.                ~
 ~                                                                           ~
 ~ Licensed under the Apache License, Version 2.0 (the "License");           ~
 ~ you may not use this file except in compliance with the License.          ~
 ~ You may obtain a copy of the License at                                   ~
 ~                                                                           ~
 ~      https://www.apache.org/licenses/LICENSE-2.0                          ~
 ~                                                                           ~
 ~ Unless required by applicable law or agreed to in writing, software       ~
 ~ distributed under the License is distributed on an "AS IS" BASIS,         ~
 ~ WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  ~
 ~ See the License for the specific language governing permissions and       ~
 ~ limitations under the License.                                            ~
 ~                                                                           ~
 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
 */

/* eslint-disable jsdoc/require-jsdoc --
 * Test-only fixtures remain local to this file.
 */

import { createMiaixzI18n } from "@miaixz/sdk/i18n";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  Dropzone,
  getDropzoneFileSignature,
  validateDropzoneFiles,
} from "../../src/components/dropzone/dropzone.js";
import { Locale } from "../../src/components/locale/locale.js";
import { Upload } from "../../src/components/upload/upload.js";
import { validateUploadRecords } from "../../src/shared/upload/use-upload-queue.js";
import type { UploadFileRecord } from "../../src/shared/upload/types.js";
import { renderWithLocale } from "../test-utils.js";

beforeEach(() => {
  HTMLDialogElement.prototype.showModal ??= function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close ??= function () {
    this.removeAttribute("open");
  };
});

afterEach(cleanup);

function makeFile(name: string, type: string, content = "content", lastModified = 10): File {
  return new File([content], name, { type, lastModified });
}

describe("Dropzone and Upload", () => {
  it("validates type, size, duplicate, and count in one deterministic pass", () => {
    const accepted = makeFile("report.pdf", "application/pdf");
    const duplicate = makeFile("report.pdf", "application/pdf");
    const wrongType = makeFile("photo.png", "image/png");
    const tooLarge = makeFile("large.pdf", "application/pdf", "long-content");
    const overflow = makeFile("extra.pdf", "application/pdf", "x");
    const result = validateDropzoneFiles([accepted, duplicate, wrongType, tooLarge, overflow], {
      accept: ".pdf, text/*",
      maxFiles: 1,
      maxSizeBytes: 8,
    });
    expect(result.accepted).toEqual([accepted]);
    expect(result.rejections.map(({ reason }) => reason)).toEqual([
      "duplicate",
      "type",
      "size",
      "count",
    ]);
    expect(getDropzoneFileSignature(accepted)).toContain("report.pdf");

    expect(() => validateDropzoneFiles([], { maxFiles: 0 })).toThrowError(
      expect.objectContaining({ code: "UI_FILE_MAX_FILES_INVALID" }),
    );
    expect(() => validateDropzoneFiles([], { maxFiles: 1, maxSizeBytes: -1 })).toThrowError(
      expect.objectContaining({ code: "UI_FILE_MAX_SIZE_INVALID" }),
    );
  });

  it("processes input and drag selections while preserving disabled behavior", () => {
    const onFiles = vi.fn();
    const onReject = vi.fn();
    const file = makeFile("note.txt", "text/plain");
    const { container, rerender } = renderWithLocale(
      <Dropzone
        accept="text/*"
        label="选择附件"
        multiple
        maxFiles={2}
        onFiles={onFiles}
        onReject={onReject}
      >
        拖放或选择
      </Dropzone>,
    );
    const root = container.querySelector(".miaixz-dropzone")!;
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;
    fireEvent.change(input, { target: { files: [file] } });
    expect(onFiles).toHaveBeenCalledWith([file]);

    const dataTransfer = { types: ["Files"], files: [file], dropEffect: "none" };
    fireEvent.dragEnter(root, { dataTransfer });
    expect(root).toHaveAttribute("data-state", "active");
    fireEvent.dragOver(root, { dataTransfer });
    expect(dataTransfer.dropEffect).toBe("copy");
    fireEvent.dragLeave(root, { dataTransfer });
    expect(root).toHaveAttribute("data-state", "idle");
    fireEvent.drop(root, { dataTransfer });
    expect(onFiles).toHaveBeenCalledTimes(2);

    rerender(
      <Dropzone disabled label="选择附件" onFiles={onFiles}>
        禁用
      </Dropzone>,
    );
    fireEvent.drop(container.querySelector(".miaixz-dropzone")!, { dataTransfer });
    expect(onFiles).toHaveBeenCalledTimes(2);
  });

  it("runs upload progress, completion, failure retry, validation, and removal", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    const onError = vi.fn();
    const upload = vi
      .fn()
      .mockImplementationOnce(
        async (_file: File, context: { reportProgress(value: number): void }) => {
          context.reportProgress(35);
        },
      )
      .mockRejectedValueOnce(new Error("failed"))
      .mockResolvedValue(undefined);
    const { container } = renderWithLocale(
      <Upload
        accept="text/plain"
        browseLabel="浏览"
        concurrency={1}
        dropLabel="拖放"
        label="上传附件"
        multiple
        maxFiles={3}
        removePolicy="immediate"
        upload={upload}
        onComplete={onComplete}
        onError={onError}
      />,
    );
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;
    const first = makeFile("first.txt", "text/plain", "one", 1);
    fireEvent.change(input, { target: { files: [first] } });
    await waitFor(() => expect(onComplete).toHaveBeenCalledWith(first));
    expect(screen.getByText("first.txt")).toBeInTheDocument();
    expect(screen.getByText("上传完成")).toBeInTheDocument();

    const second = makeFile("second.txt", "text/plain", "two", 2);
    fireEvent.change(input, { target: { files: [second] } });
    await waitFor(() => expect(screen.getByText("上传失败")).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: "重试" }));
    await waitFor(() => expect(onComplete).toHaveBeenCalledWith(second));

    const rejected = makeFile("image.png", "image/png", "x", 3);
    fireEvent.change(input, { target: { files: [rejected] } });
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(onError).toHaveBeenCalledWith(
      rejected,
      expect.objectContaining({ code: "UI_FILE_TYPE_NOT_ACCEPTED" }),
    );

    const removeButtons = screen.getAllByRole("button", { name: "移除" });
    await user.click(removeButtons[0]!);
    expect(screen.queryByText("first.txt")).toBeNull();
  });

  it("confirms removal of a persisted file", async () => {
    const user = userEvent.setup();
    const remote: UploadFileRecord = {
      id: "remote",
      name: "remote.pdf",
      size: 12,
      source: { kind: "remote" },
      status: "succeeded",
      progress: 100,
    };
    renderWithLocale(
      <Upload
        browseLabel="浏览"
        defaultFiles={[remote]}
        dropLabel="拖放"
        getRemoveConfirmation={() => ({
          title: "移除文件",
          description: "确认移除",
          confirmLabel: "确认",
          cancelLabel: "取消",
        })}
        label="上传附件"
        upload={async () => undefined}
        onComplete={() => undefined}
        onError={() => undefined}
      />,
    );
    await user.click(screen.getByRole("button", { name: "移除" }));
    expect(screen.getByRole("alertdialog", { name: "移除文件" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "确认" }));
    await waitFor(() => expect(screen.queryByText("remote.pdf")).toBeNull());
  });

  it("rejects invalid persisted upload records without normalizing them", () => {
    const remote: UploadFileRecord = {
      id: "remote",
      name: "remote.pdf",
      size: 1,
      source: { kind: "remote" },
      status: "succeeded",
      progress: 100,
    };
    expect(() => validateUploadRecords([remote, remote], true, new Set())).toThrowError(
      expect.objectContaining({ code: "UI_UPLOAD_DUPLICATE_FILE_ID" }),
    );
    expect(() => validateUploadRecords([{ ...remote, name: " " }], true, new Set())).toThrowError(
      expect.objectContaining({ code: "UI_UPLOAD_FILE_STATE_INVALID" }),
    );
    const localFile = makeFile("local.txt", "text/plain");
    expect(() =>
      validateUploadRecords(
        [
          {
            id: "local",
            name: localFile.name,
            size: localFile.size,
            lastModified: localFile.lastModified,
            source: { kind: "local", file: localFile },
            status: "uploading",
            progress: 20,
          },
        ],
        true,
        new Set(),
      ),
    ).toThrowError(expect.objectContaining({ code: "UI_UPLOAD_FILE_STATE_INVALID" }));
  });
});

describe("Locale", () => {
  const locales = createMiaixzI18n().locales;

  it("filters choices and commits the latest successful locale", async () => {
    const user = userEvent.setup();
    const onLocaleChange = vi.fn().mockResolvedValue(undefined);
    renderWithLocale(<Locale locale="zh-CN" locales={locales} onLocaleChange={onLocaleChange} />);
    const search = screen.getByRole("searchbox", { name: "搜索语言" });
    await user.type(search, "English");
    expect(screen.queryByText("简体中文")).toBeNull();
    await user.click(screen.getByRole("radio", { name: /English/u }));
    await waitFor(() => expect(onLocaleChange).toHaveBeenCalledWith("en-US"));
  });

  it("restores the last locale after failure and renders empty search state", async () => {
    const user = userEvent.setup();
    const onError = vi.fn();
    renderWithLocale(
      <Locale
        locale="zh-CN"
        locales={locales}
        onError={onError}
        onLocaleChange={async () => Promise.reject(new Error("failed"))}
      />,
    );
    await user.click(screen.getByRole("radio", { name: /English/u }));
    expect(await screen.findByRole("alert")).toHaveTextContent("UI_LOCALE_UPDATE_FAILED");
    expect(screen.getByRole("radio", { name: /简体中文/u })).toBeChecked();
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ code: "UI_LOCALE_UPDATE_FAILED" }),
    );
    await user.type(screen.getByRole("searchbox", { name: "搜索语言" }), "missing");
    expect(screen.getByText("没有匹配的语言")).toBeInTheDocument();
  });
});
