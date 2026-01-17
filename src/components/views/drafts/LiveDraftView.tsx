import { useCallback, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { VerificationData } from "tool-db";

import useFetchAvatar from "../../../hooks/useFetchAvatar";
import { AppState } from "../../../redux/stores/rendererStore";
import { InternalDraftv2 } from "../../../types";
import { DbliveDraftV1 } from "../../../types/dbTypes";
import database from "../../../utils/mtga/database";
import CardTile from "../../CardTile";
import CardLiveDraft from "./CardLiveDraft";

export default function LiveDraftView() {
  const avatars = useSelector((state: AppState) => state.avatars.avatars);
  const fetchAvatar = useFetchAvatar();

  const params = useParams<{ id: string }>();

  const [draftState, setDraftState] = useState<null | InternalDraftv2>(null);
  const [liveDraftState, setLiveDraftState] = useState<null | DbliveDraftV1>(
    null
  );

  const liveDraftKey = `live-draft-${params.id}`;

  // Store the current live draft data
  const liveDraftData = useRef<DbliveDraftV1>({
    owner: "",
    ref: "",
    votes: {},
  });

  const _voteFor = useCallback(
    async (pack: number, pick: number, vote: number) => {
      const userAccount = window.toolDb.userAccount as any;
      if (liveDraftData.current && userAccount) {
        const pubKey = userAccount.getAddress?.();
        if (pubKey) {
          const voteKey = `${pubKey}-${pack}-${pick}`;

          // Sign the vote
          const signature = await userAccount.signData(voteKey);

          // Update the live draft data
          liveDraftData.current.votes[voteKey] = {
            pubKey,
            signature,
            pack,
            pick,
            vote,
          };

          // Put the updated data
          window.toolDb.putData(liveDraftKey, liveDraftData.current);
          setLiveDraftState({ ...liveDraftData.current });
        }
      }
    },
    [liveDraftKey]
  );

  useEffect(() => {
    let draftRef = "";
    let draftListener: null | number = null;

    const keyListenerId = window.toolDb.addKeyListener<DbliveDraftV1>(
      liveDraftKey,
      (msg: VerificationData<DbliveDraftV1>) => {
        if (msg.v) {
          // Merge the votes from the received message
          liveDraftData.current = {
            ...liveDraftData.current,
            ...msg.v,
            votes: {
              ...liveDraftData.current.votes,
              ...msg.v.votes,
            },
          };

          setLiveDraftState({ ...liveDraftData.current });

          // Do only once!
          if (draftRef === "" && liveDraftData.current.ref) {
            draftRef = liveDraftData.current.ref;
            window.toolDb.subscribeData(draftRef);
            window.toolDb.getData(draftRef);

            draftListener = window.toolDb.addKeyListener<InternalDraftv2>(
              draftRef,
              (draftMsg: VerificationData<InternalDraftv2>) => {
                if (draftMsg.v) {
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
      window.toolDb.removeKeyListener(keyListenerId);
    };
  }, [liveDraftKey]);

  useEffect(() => {
    const pubKeys: string[] = [];
    if (liveDraftState) {
      Object.values(liveDraftState.votes).forEach((vote) => {
        if (!pubKeys.includes(vote.pubKey)) {
          pubKeys.push(vote.pubKey);
        }
      });

      pubKeys.forEach((key) => {
        fetchAvatar(key);
      });
    }
  }, [fetchAvatar, avatars, liveDraftState]);

  const currentVotes: Record<number, string[]> = {};
  if (liveDraftData.current) {
    Object.keys(liveDraftData.current.votes || {})
      .filter((key) =>
        key.endsWith(`-${draftState?.currentPack}-${draftState?.currentPick}`)
      )
      .forEach((key) => {
        const keyData = liveDraftData.current?.votes[key];
        if (keyData) {
          const grpId = keyData.vote || 0;
          if (!currentVotes[grpId]) currentVotes[grpId] = [];
          currentVotes[grpId].push(keyData.pubKey || "");
        }
      });
  }

  return (
    <>
      {draftState ? (
        <div className="live-draft-container">
          <div className="title">
            <h2>{`Pack: ${draftState.currentPack + 1}, Pick: ${
              draftState.currentPick + 1
            }`}</h2>
          </div>
          <div className="draft-container">
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
            <div className="picks-container">
              {draftState.pickedCards.map((id) => {
                const fullCard = database.card(id);

                const dfcCard =
                  fullCard && fullCard.LinkedFaceGrpIds.length > 0
                    ? database.card(fullCard.LinkedFaceGrpIds[0])
                    : undefined;

                return (
                  <CardTile
                    key={`draft-card-tile-${id}`}
                    card={fullCard}
                    dfcCard={dfcCard}
                    indent="a"
                    isHighlighted={false}
                    isSideboard={false}
                    quantity={{ type: "NUMBER", quantity: 1 }}
                    showWildcards={false}
                  />
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <></>
      )}
    </>
  );
}
