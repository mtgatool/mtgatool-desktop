import { useCallback, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";

import { InternalDraftv2 } from "mtgatool-shared";
import Automerge, { FreezeObject } from "automerge";
import { base64ToBinaryDocument, signData, toBase64 } from "tool-db";
import { DbliveDraftV1 } from "../../../types/dbTypes";
import { AppState } from "../../../redux/stores/rendererStore";
import CardLiveDraft from "./CardLiveDraft";

import useFetchAvatar from "../../../hooks/useFetchAvatar";

export default function LiveDraftView() {
  const avatars = useSelector((state: AppState) => state.avatars.avatars);
  const fetchAvatar = useFetchAvatar();

  const params = useParams<{ id: string }>();

  const [draftState, setDraftState] = useState<null | InternalDraftv2>(null);
  const [liveDraftState, setLiveDraftState] = useState<null | DbliveDraftV1>(
    null
  );

  const liveDraftKey = `live-draft-${params.id}`;

  const liveDraftCrdt = useRef<FreezeObject<DbliveDraftV1>>();

  useEffect(() => {
    liveDraftCrdt.current = Automerge.init();
  }, []);

  const _voteFor = useCallback(
    (pack: number, pick: number, vote: number) => {
      if (liveDraftCrdt.current && window.toolDb.user) {
        if (window.toolDb.user) {
          const voteKey = `${window.toolDb.user.pubKey}-${pack}-${pick}`;
          signData(
            voteKey,
            window.toolDb.user?.keys.signKeys.privateKey as CryptoKey
          ).then((signature) => {
            const newDoc = Automerge.change(liveDraftCrdt.current, (doc) => {
              // eslint-disable-next-line no-param-reassign
              doc.votes[voteKey] = {
                pubKey: window.toolDb.user?.pubKey || "",
                signature: toBase64(signature),
                pack,
                pick,
                vote,
              };
            });

            if (liveDraftCrdt.current && newDoc) {
              window.toolDb.putCrdt(
                liveDraftKey,
                Automerge.getChanges(liveDraftCrdt.current, newDoc)
              );
              liveDraftCrdt.current = newDoc;
            }
          });
        }
      }
    },
    [liveDraftCrdt, draftState]
  );

  useEffect(() => {
    let draftRef = "";
    let draftListener: null | number = null;

    const keyLIstenerId = window.toolDb.addKeyListener<DbliveDraftV1>(
      liveDraftKey,
      (msg) => {
        if (msg.type === "crdt") {
          const doc = Automerge.load<DbliveDraftV1>(
            base64ToBinaryDocument(msg.doc)
          );
          liveDraftCrdt.current = Automerge.merge(Automerge.init(), doc);

          setLiveDraftState(liveDraftCrdt.current);

          // Do only once!
          if (draftRef === "") {
            draftRef = liveDraftCrdt.current.ref;
            window.toolDb.subscribeData(draftRef);
            window.toolDb.getData(draftRef);

            draftListener = window.toolDb.addKeyListener<InternalDraftv2>(
              draftRef,
              (draftMsg) => {
                if (draftMsg.type === "put") {
                  setDraftState(draftMsg.v);
                }
              }
            );
          }
        }
      }
    );

    window.toolDb.subscribeData(liveDraftKey);
    window.toolDb.getData(liveDraftKey);

    return () => {
      if (draftListener) {
        window.toolDb.removeKeyListener(draftListener);
      }
      window.toolDb.removeKeyListener(keyLIstenerId);
    };
  }, [liveDraftCrdt, params]);

  useEffect(() => {
    const pubKeys: string[] = [];
    if (liveDraftState) {
      Object.values(liveDraftState.votes).forEach((vote) => {
        if (!pubKeys.includes(vote.pubKey)) {
          pubKeys.push(vote.pubKey);
        }
      });

      pubKeys.forEach((key) => {
        if (!avatars[key]) {
          fetchAvatar(key);
        }
      });
    }
  }, [fetchAvatar, avatars, liveDraftState]);

  const currentVotes: Record<number, string[]> = {};
  if (liveDraftCrdt.current) {
    Object.keys(liveDraftCrdt.current.votes || {})
      .filter((key) =>
        key.endsWith(`-${draftState?.currentPack}-${draftState?.currentPick}`)
      )
      .forEach((key) => {
        const keyData = liveDraftCrdt.current?.votes[key];
        if (keyData) {
          const grpId = keyData.vote || 0;
          if (!currentVotes[grpId]) currentVotes[grpId] = [];
          currentVotes[grpId].push(keyData.pubKey || "");
        }
      });
  }

  return (
    <>
      <p>{params.id}</p>
      {draftState ? (
        <div className="live-draft-container">
          <p>{`Pack: ${draftState.currentPack}, Pick: ${draftState.currentPick}`}</p>
          <div className="pack-container">
            {draftState.packs[draftState.currentPack][
              draftState.currentPick
            ].map((grpId) => {
              return (
                <div key={`${grpId}-draft-pick`}>
                  <CardLiveDraft
                    grpId={grpId}
                    onClick={() =>
                      _voteFor(
                        draftState.currentPack,
                        draftState.currentPick,
                        grpId
                      )
                    }
                  />
                  <div className="avatars-list">
                    {currentVotes[grpId] &&
                      currentVotes[grpId].map((pubKey) => {
                        return (
                          <div
                            key={`${pubKey}-${grpId}-avatar`}
                            className="vote-avatar"
                            style={{
                              backgroundImage: `url(${avatars[pubKey]})`,
                            }}
                          />
                        );
                      })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <></>
      )}
    </>
  );
}
