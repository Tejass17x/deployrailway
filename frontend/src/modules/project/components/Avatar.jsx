import React from "react";
import UserAvatar from '../../../components/ui/Avatar';

export default function Avatar({ seed, index, src }) {
  return (
    <UserAvatar
      src={src}
      name={seed}
      size="sm"
      className="ring-2 ring-white"
    />
  );
}