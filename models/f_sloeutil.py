
import re

SLOE_UUID_VERIFY_RE = re.compile('([0-9a-f]{8})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{12})$')
SLOE_UUID_CONDITION_PARTIAL_RE = re.compile('([0-9a-f]{0,8})-?([0-9a-f]{0,4})-?([0-9a-f]{0,4})-?([0-9a-f]{0,4})-?([0-9a-f]{0,12})$')

def sloe_condition_uuid(in_uuid):
    match = SLOE_UUID_CONDITION_PARTIAL_RE.match(in_uuid.lower().strip(" '\""))
    if match:
        out_uuid = '-'.join(match.groups()).rstrip('-')
        return out_uuid, True
    else:
        return '', False


def sloe_verify_uuid(in_uuid):
    match = SLOE_UUID_VERIFY_RE.match(in_uuid)
    if match:
        return True

    return False

