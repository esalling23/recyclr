/**
 * (Site name here)
 *
 * Item page Model
 * @module Item
 * @class Item
 * @author Eron Salling
 *
 * For field docs: http://keystonejs.com/docs/database/
 *
 * ==========
 */

var keystone = require('keystone');
var _ = require('underscore');
var Types = keystone.Field.Types;

/**
 * Item model
 * @constructor
 * See: http://keystonejs.com/docs/database/#lists-options
 */
var Item = new keystone.List('Item',
	{
		label: 'Items',
		singular: 'Item',
		autokey: { path: 'item_key', from: 'name', unique: true }
	});

/**
 * Model Fields
 * @main Item
 */
Item.add({

	name: { type: String, label: 'Name', required: true, initial: true },
	info: { type: Types.Textarea, label: 'Item Bio', note: 'Appears BEFORE player swipes item', required: true, initial: true},
	profilePic: { type: Types.CloudinaryImage, label: 'Item Image - Main', note: 'Appears on match screen - should be a repeat of one of the Image Profiles', folder: 'RecycleMe', autocleanup: true , required: true, initial: true },
	// profiles: { type: Types.CloudinaryImages, label: 'Image profiles', folder: 'RecycleMe', autocleanup: true },
	material: {
		type: Types.Relationship,
		ref: 'Material',
		label: 'Material(s)',
		many: true
	},
	status: { type: Types.Select, label: 'Correct Placement', options: 'Recycle, Trash, Compost, Special', required: true, initial: true},
	statusOr: { type: Types.Select, label: 'Alternative Placement', options: 'Recycle, Trash, Compost, Special'},
	
  specialStatus: {
		type: Types.Relationship,
		ref: 'SpecialOption',
		label: 'What kind of special thing should be done with this item?',
		dependsOn: {status:'Special'}
	},
	specialStatusOr: {
		type: Types.Relationship,
		ref: 'SpecialOption',
		label: 'OR : What kind of special thing should be done with this item?',
		dependsOn: {statusOr:'Special'}
	},

	rationale: { type: Types.Textarea, label: 'Explanation/Feedback', required: true, initial: true },
	level: { type: Types.Select, label: 'Game Level', options: 'One, Two, Three', required: true, initial: true},

	enabled: { type: Boolean, default: true, label: 'Enabled'}

});

Item.schema.statics.removeResourceRef = function(resourceId, callback) {

    Item.model.update({
            $or: [{
                'material': resourceId
            }, {
				'specialStatus':resourceId
            }, {
                'specialStatusOr':resourceId
            }]
        },

        {
            $pull: {
                'material': resourceId,
                'specialStatus':resourceId,
                'specialStatusOr':resourceId
            }
        },

        {
            multi: true
        },

        function(err, result) {
        	console.log(result);

            callback(err, result);

            if (err)
                console.error(err);
        }
    );

};

/**
 * Model Registration
 */
Item.defaultSort = 'level';
Item.defaultColumns = 'name, level, status';
Item.register();
